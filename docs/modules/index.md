# Модули Bismuth

## Приложение и конфигурация

- `src/app.js` — точка входа; создаёт `Application` и запускает её.
- `src/core/Application.js` — связывает состояние, конфигурацию, аудио и UI, обрабатывает команды приложения.
- `src/core/ApplicationState.js` — хранит состояние воспроизведения и интерфейса.
- `src/core/ConfigManager.js` — загружает `config.yml` и применяет значения по умолчанию.
- `src/core/Environment.js` — определяет каталоги ресурсов и инициализирует пользовательские настройки.
- `src/core/KeybindsManager.js` — регистрирует горячие клавиши из конфигурации.

## Аудио и треки

- `src/audio/` — загрузка, декодирование и вывод аудио.
- `src/tracks/Track.js` и `src/tracks/Playlist.js` — данные и операции с треками и плейлистом.

Аудио декодируется FFmpeg; метаданные читаются через `ffprobe`, а вывод выполняют Web Audio API и `speaker`.

## Интерфейс

- `src/ui/UIManager.js` и `src/ui/TabManager.js` — инициализация интерфейса и управление вкладками.
- `src/ui/ThemeManager.js` — загрузка YAML-тем и наследование компонентов.
- `src/ui/tabs/` — вкладки Welcome, Playlist, Files и Config. Вкладка Config пока является заглушкой.
- `src/ui/tabs/PlaylistTab.js` — список плейлиста и информация о выделенном треке.
- `src/ui/elements/` — элементы интерфейса, включая PlaylistElement, DraggableSeparator, плеер, заголовок вкладок и сообщение.
- `src/util/` — логирование, цвета и вспомогательные функции.