import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import { api } from "src/boot/axios";
import { computed, ref, watch } from "vue";

const authKey = "authData";
const apiUrlKey = "ApiUrl";
const downloadDirKey = "downloadDir";
const downloadModeKey = "downloadMode";
const downloadUsernameKey = "downloadUsername";

export const useSettingsStore = defineStore("settings", () => {
  const localStorageAuth = LocalStorage.getItem(authKey);
  const localStorageApiUrl = LocalStorage.getItem(apiUrlKey);
  const localStorageDownloadDir = LocalStorage.getItem(downloadDirKey);
  const localStorageDownloadMode = LocalStorage.getItem(downloadModeKey);
  const localStorageDownloadUsername =
    LocalStorage.getItem(downloadUsernameKey);

  if (
    localStorageAuth &&
    localStorageAuth.username &&
    localStorageAuth.password
  ) {
    api.defaults.auth = localStorageAuth;
  }

  const auth = ref(
    localStorageAuth ? localStorageAuth : { username: null, password: null },
  );
  const apiUrl = ref(localStorageApiUrl ? localStorageApiUrl : "");
  const downloadDir = ref(
    localStorageDownloadDir ? localStorageDownloadDir : "",
  );
  const downloadMode = ref(
    localStorageDownloadMode ? localStorageDownloadMode : "single",
  );
  const downloadUsername = ref(
    localStorageDownloadUsername ? localStorageDownloadUsername : "",
  );

  const isAuth = computed(() => {
    return auth.value.username && auth.value.password && apiUrl;
  });

  function save() {
    LocalStorage.setItem(authKey, auth.value);
    LocalStorage.setItem(apiUrlKey, apiUrl.value);
    LocalStorage.setItem(downloadDirKey, downloadDir.value);
    LocalStorage.setItem(downloadModeKey, downloadMode.value);
    LocalStorage.setItem(downloadUsernameKey, downloadUsername.value);
    api.defaults.auth = auth.value;
  }

  function dump() {
    return JSON.stringify({
      auth: auth.value,
      apiUrl: apiUrl.value,
      downloadDir: downloadDir.value,
      downloadMode: downloadMode.value,
      downloadUsername: downloadUsername.value,
    });
  }

  function restore(config) {
    const configData = JSON.parse(config);
    auth.value = configData.auth;
    apiUrl.value = configData.apiUrl;
    downloadDir.value = configData.downloadDir;
    downloadMode.value = configData.downloadMode;
    downloadUsername.value = configData.downloadUsername;
    save();
  }

  return {
    // store
    auth,
    apiUrl,
    downloadDir,
    downloadMode,
    downloadUsername,
    // getters
    isAuth,
    // funcs
    save,
    dump,
    restore,
  };
});
