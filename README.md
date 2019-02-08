# VK-Audio-Downloader
Утилита для скачивания музыки из вашего аккаунта в ВК

## Сборка вручную и запуск
У вас должен быть установлен git и node.js
```sh
$ git clone https://github.com/syleront/vk-audio-downloader.git
$ cd vk-audio-downloader-master
$ npm install
$ npm run start
```

## Настройка
Редактируем config.js, указывая логин, пароль, и путь сохранения файлов.
<br>
Обратите внимание, что в Windows путь должен указываться либо через "/", либо "\\\\"

Пример:
```json
{
  "download_path": "C:/Music/VK",
  "login": "88005553535",
  "password": "qwerty123"
}
```
Либо так:
```json
{
  "download_path": "C:\\Music\\VK",
  "login": "88005553535",
  "password": "qwerty123"
}
```