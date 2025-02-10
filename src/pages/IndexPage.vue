<template>
  <q-page padding class="column q-gutter-sm">
    <div class="row full-width justify-center">
      <q-spinner v-if="torrentFiles.length == 0" size="3rem" class="q-mt-xl" />
    </div>
    <TorrentFile
      v-for="torrentFile in torrentFiles"
      :torrentFile="torrentFile"
      :key="torrentFile.name"
    />
    <div v-if="torrentFiles.length != 0">
      <q-select
        v-if="$settings.downloadMode.startsWith('jellyfin')"
        label="Тип контента"
        outlined
        emit-value
        map-options
        v-model="jellyfinContentType"
        :options="jellyfinContentTypes"
      >
      </q-select>
      <q-toggle
        v-if="$settings.downloadMode.endsWith('multiuser')"
        label="Скачать в персональную папку"
        v-model="isPersonalDownload"
      ></q-toggle>
      <q-toggle
        v-if="jellyfinContentType == 'shows'"
        label="Конкретный сезон"
        v-model="isShowSeason"
      ></q-toggle>
      <div
        class="row no-wrap"
        v-if="jellyfinContentType == 'shows' && isShowSeason"
      >
        <q-input
          label="Название Сериала"
          outlined
          v-model="showTitle"
          class="q-mr-sm"
        ></q-input>
      </div>
    </div>
  </q-page>
  <q-page-sticky
    v-if="torrentFiles.length != 0"
    position="bottom"
    :offset="[10, 10]"
  >
    <q-btn
      icon="download"
      label="Скачать"
      color="primary"
      @click="sendFileToTransmission"
    />
  </q-page-sticky>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import TorrentFile from "src/components/TorrentFile.vue";
import { useSettingsStore } from "src/stores/settings-store";

const $q = useQuasar();
const $settings = useSettingsStore();

const torrentFiles = ref([]);

const isPersonalDownload = ref(true);
const jellyfinContentType = ref("movies");
const jellyfinContentTypes = ref([
  { label: "Сериал", value: "shows" },
  { label: "Фильм", value: "movies" },
  { label: "Музыка", value: "music" },
]);
const isShowSeason = ref(false);
const showTitle = ref("");

function blobToBase64(blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function createMultiuserDir(baseDir) {
  if (!isPersonalDownload.value) {
    return `${baseDir}/all`;
  } else {
    return `${baseDir}/${$settings.downloadUsername}`;
  }
}

function createJellyfinDir(baseDir) {
  if (!isShowSeason.value) {
    return `${baseDir}/${jellyfinContentType.value}`;
  } else {
    return `${baseDir}/${jellyfinContentType.value}/${showTitle.value}`;
  }
}

function getDownloadDir() {
  switch ($settings.downloadMode) {
    case "single":
      return $settings.downloadDir;
    case "jellyfin":
      return createJellyfinDir($settings.downloadDir);
    case "jellyfin-multiuser":
      return createJellyfinDir(createMultiuserDir($settings.downloadDir));
  }
}

async function sendFileToTransmission() {
  let downloadDir = getDownloadDir();
  let promises = [];
  torrentFiles.value.forEach(async (torrentFile) => {
    const blobData = await blobToBase64(torrentFile.blob);
    const rawBlobData = blobData.split(",")[1].trim();
    const sendRequest = {
      method: "torrent-add",
      arguments: { "download-dir": downloadDir, metainfo: rawBlobData },
    };
    promises.push(
      api.post($settings.apiUrl, sendRequest).then((response) => {
        if (response.data.result != "success") {
          $q.notify({
            message: `[Ошибка] ${response.data.result}`,
            type: "negative",
          });
          return;
        }
        $q.notify({ message: "Загрузка начата", type: "positive" });
      }),
    );
  });

  await Promise.all(promises);
}

$q.bex.on("foundURL", (message) => {
  torrentFiles.value.push(message.payload);
});

onMounted(async () => {
  const contentPort = $q.bex.portList.find((portName) =>
    portName.startsWith("content@"),
  );
  if (contentPort) {
    $q.bex.send({ event: "findURL", to: contentPort });
  }
});
</script>
