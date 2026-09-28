# Karaoke Maker

[View on GitHub](https://github.com/usr-wwelsh/karaoke-maker)

A user-friendly GUI application for creating karaoke videos from MP3 files. Select an MP3, let AI transcribe the lyrics, and generate a karaoke video with animated lyrics.

### Example generated video
[![Doris Lujan - You Are My Junkie](https://img.youtube.com/vi/XPUibKg3l8o/0.jpg)](https://www.youtube.com/watch?v=XPUibKg3l8o)

## Features

- **AI-Powered Lyrics Transcription**:
  - Automatic transcription using OpenAI's Whisper
  - Word-level timestamps for perfect sync
  - Editable lyrics with preserved timing - fix any transcription errors while keeping perfect synchronization

- **High-Quality Audio Processing**:
  - Vocal separation using Meta's Demucs (optional)
  - Clean instrumental tracks for true karaoke experience

- **Customizable Visuals**:
  - Multiple gradient background presets
  - Custom background image support
  - Smooth animated lyrics with word highlighting

- **Real-Time Progress Tracking**:
  - Dual progress bars showing overall and detailed progress
  - Live progress from AI models (Demucs, Whisper, FFmpeg)

- **Cross-Platform**:
  - Windows (.exe coming soon)
  - Linux (Flatpak coming soon)
  - macOS (source installation)

## Requirements

### System Requirements

- Python 3.8 or higher
- FFmpeg (must be installed and in PATH)
- CUDA-compatible GPU (optional, for faster processing)

### Installing FFmpeg

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install ffmpeg
```

**Linux (Fedora)**:
```bash
sudo dnf install ffmpeg
```

**macOS**:
```bash
brew install ffmpeg
```

**Windows**:
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/usr-wwelsh/karaoke-maker.git
cd karaoke-maker
```

2. Run the setup script (recommended):
```bash
./setup.sh  # Linux/macOS
# or
setup.bat   # Windows
```

**OR** Manual installation:

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python main.py
```

### Optional: High-Quality Vocal Separation

By default, the app works without vocal separation (uses original audio for transcription). For better karaoke quality with isolated vocals, you can optionally install Demucs.

**See [INSTALL_DEMUCS.md](INSTALL_DEMUCS.md) for detailed installation instructions.**

Quick install (Linux/macOS):
```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt install lame liblame-dev

# Activate venv and install
source venv/bin/activate
pip install lameenc
pip install -U git+https://github.com/facebookresearch/demucs#egg=demucs
```

### First Run

On first run, the application will download AI models:
- Whisper transcription model (~140MB for base model)
- Demucs vocal separation model (~300MB, only if installed)

This only happens once. Models are cached for future use.

**Note**: Without Demucs, the app will use the original audio (with background music) for transcription. This works fine but may be slightly less accurate than using isolated vocals. The karaoke video will include vocals in the background (not true karaoke). For best results, install Demucs to get instrumental-only tracks.

## Usage

1. **Select MP3 File**: Click "Browse" to select your MP3 file

2. **Auto-Transcribe**: The app automatically transcribes lyrics with AI
   - Lyrics appear with timestamps: `[0.00-0.50] word`
   - Edit any words if transcription isn't perfect
   - Timing is preserved when you edit words
   - Click "Reload Lyrics" to re-transcribe if needed

3. **Select Background**: Choose a gradient preset or upload a custom image

4. **Generate**: Click "Generate Karaoke Video" and choose save location

5. **Watch Progress**: Two progress bars show overall step and detailed AI progress

6. **Enjoy**: Your karaoke video is ready!

## Processing Time

Typical processing time for a 4-minute song:

- **With GPU (CUDA)**: 2-3 minutes
- **CPU only**: 4-6 minutes

Breakdown:
- Vocal separation: 1-3 minutes
- Transcription/alignment: 30 seconds - 2 minutes
- Video rendering: 30 seconds - 1 minute

## Troubleshooting

### "FFmpeg not found"
Make sure FFmpeg is installed and in your system PATH. Test with:
```bash
ffmpeg -version
```

### Out of memory errors
- Try closing other applications
- Use a smaller Whisper model (edit `lyrics_handler.py`, change 'base' to 'tiny')
- Process shorter songs first

### GPU errors (CUDA kernel image, compatibility issues)
- **Your GPU may be too old** for PyTorch 2.0+
- The app **automatically detects** this and uses CPU mode
- See [GPU_TROUBLESHOOTING.md](GPU_TROUBLESHOOTING.md) for details
- Quick fix: `export CUDA_VISIBLE_DEVICES=-1` before running

### Poor transcription quality
- Ensure audio has clear vocals
- Try a larger Whisper model ('small' or 'medium' in `lyrics_handler.py`)
- Edit the transcribed lyrics to fix any errors - timing will be preserved
- Songs with heavy background music may transcribe better with Demucs installed

## Development

### Project Structure

```
karaoke-maker/
├── main.py                 # Main GUI application
├── audio_processor.py      # Demucs vocal separation
├── lyrics_handler.py       # Whisper AI transcription
├── alignment.py            # Forced alignment for lyrics
├── video_renderer.py       # FFmpeg video generation
├── utils.py                # Metadata extraction, helpers
├── requirements.txt        # Python dependencies
├── LICENSE                 # MIT License
└── README.md              # This file
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- **Whisper**: OpenAI - Speech recognition and transcription - [github.com/openai/whisper](https://github.com/openai/whisper)
- **Demucs**: Meta AI - Music source separation - [github.com/facebookresearch/demucs](https://github.com/facebookresearch/demucs)
- **CustomTkinter**: Modern UI library - [github.com/TomSchimansky/CustomTkinter](https://github.com/TomSchimansky/CustomTkinter)
- **FFmpeg**: Video encoding and processing - [ffmpeg.org](https://ffmpeg.org)

## Author

Created by [usr-wwelsh](https://github.com/usr-wwelsh)

## Roadmap

- [ ] Windows .exe packaging
- [ ] Linux Flatpak packaging
- [ ] macOS .app bundle
- [ ] Multiple font options
- [ ] Adjustable text size/colors
- [ ] Export options (resolution, format)
- [ ] Batch processing
- [ ] Video preview before export
- [ ] LRC file import/export
