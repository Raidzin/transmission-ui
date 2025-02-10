<template>
  <q-page padding class="q-gutter-sm">
    <q-input
      label="Логин"
      outlined
      v-model="$settings.auth.username"
      @update:model-value="$settings.save()"
    ></q-input>
    <q-input
      label="Пароль"
      outlined
      v-model="$settings.auth.password"
      type="password"
      @update:model-value="$settings.save()"
    ></q-input>
    <q-input
      label="Transmission API URL"
      outlined
      v-model="$settings.apiUrl"
      @update:model-value="$settings.save()"
    ></q-input>
    <q-input
      label="Папка загрузки Transmission"
      outlined
      v-model="$settings.downloadDir"
      @update:model-value="$settings.save()"
    ></q-input>
    <q-select
      label="Структура под-папок"
      outlined
      emit-value
      map-options
      v-model="$settings.downloadMode"
      :options="downloadModeOptions"
      @update:model-value="$settings.save()"
    ></q-select>
    <q-input
      v-if="$settings.downloadMode == 'jellyfin-multiuser'"
      label="Имя персональной папки"
      outlined
      v-model="$settings.downloadUsername"
      @update:model-value="$settings.save()"
    ></q-input>
    <q-page-sticky
      v-if="$settings.isAuth"
      position="bottom-right"
      :offset="[10, 10]"
    >
      <q-btn
        label="Тест"
        @click="testTransmission"
        color="accent"
        :loading="testLoading"
      ></q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useSettingsStore } from "src/stores/settings-store";
import { ref } from "vue";

const $settings = useSettingsStore();
const $q = useQuasar();
const testLoading = ref(false);
const downloadModeOptions = ref([
  { label: "Без под-папок", value: "single" },
  { label: "Jellyfin", value: "jellyfin" },
  { label: "Jellyfin многопользовательский", value: "jellyfin-multiuser" },
]);

async function testTransmission() {
  testLoading.value = true;
  const promise = async () => {
    await api.updateTransmissionID();
    await api
      .post($settings.apiUrl, {
        method: "torrent-get",
        arguments: { fields: ["id", "name", "percentDone"] },
      })
      .then((response) => {
        if (response.data.result == "success") {
          $q.notify({ message: "Подключение успешно!", type: "positive" });
        } else {
          $q.notify({ message: "Неизвестная ошибка!", type: "negative" });
        }
      });
  };
  await promise()
    .catch((err) => {
      console.error(err);
      if (err.code == "ECONNABORTED") {
        $q.notify({ message: `Нет ответа от сервера`, type: "negative" });
        return;
      }
      if (!err.response) {
        $q.notify({ message: `${err}`, type: "negative" });
        return;
      }
      switch (err.response.status) {
        case 401:
          $q.notify({
            message: "Неверный логин или пароль!",
            type: "negative",
          });
          break;
        case 404:
          $q.notify({ message: "Неверный API URL!", type: "negative" });
          break;
        case _:
          $q.notify({ message: "Неизвестная ошибка!", type: "negative" });
          break;
      }
    })
    .finally(() => {
      testLoading.value = false;
    });
}
</script>
