import log4js from "log4js";

log4js.configure({
  appenders: {
    everything: {
      type: "file",
      filename: "file.log",
      maxLogSize: 10485760,
      backups: 3,
      compress: true,
    }
  },
  categories: { default: { appenders: ["everything"], level: "debug" } },
});

const log = log4js.getLogger("everything");

export const registerLogInfo = (message) => {
  log.info(message);
}

export const registerLogError = (message) => {
  log.error(message);
}
