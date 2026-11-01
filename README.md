# Bismuth

## Описание

Bismuth - минималистичный (не в плане ресурсов) аудио плейер с терминальным интерфейсом, написанный на Node.js.

Плеер находится в разработке! Многие функцию пока не работают/работают не так, как должны.

![alt text](images/image-2.png)

![alt text](images/image.png)

![alt text](images/image-1.png)

## Возможности

- Воспроизведение аудио файлов различных форматов (MP3, OGG, WAV и другие), с помощью ffmpeg
- Воспроизведение аудио производится с помощью node-speaker
- Терминальный интерфейс, построенный на reblessed (fork blessed), с поддержкой мыши
- Настройка горячих клавиш и выбор темы через конфигурационный файл
- Возможность создавать собственные темы интерфейса
- Просмотр информации об аудио-файле с помощью ffprobe
- Поддержка Windows, Linux и macOS (я надеюсь)

- В будущем планируется прямое скачивание треков через Yandex Music API (с помощью пользовательского токена)

## Установка

1. Установите Node.js (>= 22)

2. Клонируйте репозиторий:
   ```
   git clone https://github.com/SuperJaba2000/bismuth
   cd bismuth
   ```

3. Установите зависимости:
   ```
   npm install
   ```

## Запуск (без сборки):

   ```
   npm start
   ```

## Настройка и кастомизация

В production-режиме конфигурация приложения и темы хранятся в папке `bismuth` в пользовательском каталоге конфигурации:

- Linux: `~/.config/bismuth/` (или `$XDG_CONFIG_HOME/bismuth/`, если задан `XDG_CONFIG_HOME`)
- macOS: `~/Library/Application Support/bismuth/`
- Windows: `%APPDATA%\bismuth\`

В production-режиме (`NODE_ENV=production`) при первом запуске приложение копирует туда `config.yml` и стандартные темы из `src/defaults/`. Уже существующие файлы не перезаписываются. После этого приложение читает конфигурацию из каталога пользователя:

- `config.yml` — настройки приложения
- `themes/` — стандартные и пользовательские темы

Чтобы при запуске из исходников использовать эти файлы, запустите приложение с `NODE_ENV=production`:

```
npx cross-env NODE_ENV=production node src/app.js
```

Пример `config.yml`:

```yaml
theme: basic
show-welcome-screen: true

binds:
  change-tab:
    - tab
  play-pause:
    - space
  next-track:
    - "."
  previous-track:
    - ","
```

Для изменения настроек отредактируйте `config.yml` и перезапустите приложение. В dev-режиме (`npm start` и `npm run debug`) настройки читаются из `src/defaults/config.yml`, а темы — из `src/defaults/themes/`; пользовательский каталог конфигурации в этом режиме не используется.

Чтобы создать тему, добавьте папку в `themes/`, файл `theme.yml` и YAML-файлы компонентов в `components/`. Например:

```
themes/
  my-theme/
    theme.yml
    components/
      colors.yml
```

Минимальный `theme.yml`:

```yaml
theme:
  name: my-theme
  description: My custom theme
based-on: basic
```

`based-on: basic` наследует значения стандартной темы; в файлах своей темы достаточно переопределить нужные параметры. Не изменяйте файлы темы `basic` — при создании своей темы они служат примером. Чтобы включить тему, укажите её имя в `config.yml`:

```yaml
theme: my-theme
```

## Сборка:

1. Запустите сборку:
   ```
   npm run build
   ```

   Скрипт сначала собирает приложение через webpack, затем создаёт исполняемый файл для `node24-win-x64`. Чтобы выбрать другую платформу, измените target в `package.json` или запустите `pkg` самостоятельно:

   ```
   npx pkg . -t <target>
   ```


## Структура проекта

- `src/app.js` - точка входа приложения
- `src/core/` - приложение, состояние, конфигурация и горячие клавиши
- `src/audio/` - загрузка, обработка и воспроизведение аудио
- `src/tracks/` - модели треков и плейлиста
- `src/ui/` - компоненты интерфейса
- `src/defaults/` - стандартная конфигурация и тема

## Зависимости

- `@descript/web-audio-js` - для работы с веб-аудио
- `ffmpeg-static` - статическая сборка FFmpeg
- `FFmpeg` - декодирование аудио; используется системный ffmpeg или bundled `ffmpeg-static`
- `ffprobe` - чтение метаданных; входит в системную установку FFmpeg
- `reblessed` - терминальный UI (форк blessed)
- `speaker` - вывод аудио через Speaker
- `winston` - логирование
- `yaml` - чтение YAML-конфигурации приложения и тем

Для разработки и сборки используются `cross-env`, `@yao-pkg/pkg` и инструменты webpack.

Если `ffmpeg` или `ffprobe` не находятся в `PATH`, задайте пути через переменные
окружения `FFMPEG_PATH` и `FFPROBE_PATH` соответственно.

## Автор

superjaba2000

## Лицензия

ISC