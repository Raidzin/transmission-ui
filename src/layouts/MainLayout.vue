<template>
  <q-layout view="hHh lpR fFf" style="width: 400px; height: 666px">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title>Transmission UI</q-toolbar-title>
      </q-toolbar>
      <q-tabs align="left">
        <q-route-tab :to="{ name: 'index' }" icon="home" />
        <q-route-tab :to="{ name: 'settings' }" icon="settings">
          <q-menu context-menu>
            <q-list separator>
              <q-item clickable v-ripple @click="exportConfig">
                <q-item-section avatar>
                  <q-icon color="primary" name="upload" />
                </q-item-section>
                <q-item-section>Экспорт</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="ImportConfig">
                <q-item-section avatar>
                  <q-icon color="primary" name="download" />
                </q-item-section>
                <q-item-section>Импорт</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-route-tab>
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar class="row">
        <q-btn
          href="https://github.com/Raidzin/transmission-ui"
          target="_blank"
          label="by Raidzin"
          no-caps
          flat
          color="light"
        ></q-btn>
        <q-space />
        <div>v{{ version }}</div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { api } from "src/boot/axios";
import { useQuasar } from "quasar";
import { useSettingsStore } from "src/stores/settings-store";
import { version } from "../../package.json";

const $settings = useSettingsStore();
const $q = useQuasar();

function exportConfig() {
  let blob = new Blob([$settings.dump()], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transmission-ui-config.json";
  link.click();
}

function ImportConfig() {
  $q.dialog({
    title: "Импорт настроек",
    message: "Вставьте содержимое файла настроек",
    prompt: {
      model: "",
      type: "textarea", // optional
    },
    cancel: true,
    persistent: true,
    seamless: true,
  }).onOk((data) => {
    $settings.restore(data);
  });
}

onMounted(async () => {
  if ($settings.isAuth) {
    await api.updateTransmissionID().catch((err) => {
      console.error(err);
      $q.notify({ message: "Проверьте настройки сервера!", type: "warning" });
    });
  }
});
</script>
