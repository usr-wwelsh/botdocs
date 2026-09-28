# Quick Start Guide

Get up and running with Karaoke Maker in 5 minutes!

## Prerequisites

1. **Python 3.8+**: Check with `python3 --version`
2. **FFmpeg**: Required for video encoding
   - Linux: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo dnf install ffmpeg` (Fedora)
   - macOS: `brew install ffmpeg`
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation

### Linux/macOS

```bash
# Navigate to project directory
cd karaoke-maker

# Run setup script (installs dependencies)
./setup.sh

# Run the application
./run.sh
```

### Windows

```batch
REM Navigate to project directory
cd karaoke-maker

REM Run setup script (installs dependencies)
setup.bat

REM Run the application
run.bat
```

## First Run

1. **Model Download**: On first run, Whisper AI model will download (~140MB). This is one-time only.
2. **Wait**: Initial setup may take 2-5 minutes depending on your internet speed.
3. **GPU**: If you have an NVIDIA GPU with CUDA, it will be auto-detected for faster processing.
4. **Vocal Separation**: By default, Demucs is not installed (requires compilation). The app will work fine without it, using the original audio for transcription.

### Optional: High-Quality Vocal Separation

For best results, install Demucs after initial setup:

**Linux**:
```bash
sudo apt install lame liblame-dev  # Ubuntu/Debian
# or
sudo dnf install lame lame-devel   # Fedora

# Then activate venv and install
source venv/bin/activate
pip install lameenc
pip install -U git+https://github.com/facebookresearch/demucs#egg=demucs
```

**macOS**:
```bash
brew install lame
source venv/bin/activate
pip install lameenc
pip install -U git+https://github.com/facebookresearch/demucs#egg=demucs
```

## Basic Usage

### Method 1: Auto-Transcribe (Recommended)

1. Click **Browse** and select your MP3 file
2. Keep **Auto-transcribe** selected
3. Choose a background gradient
4. Click **Generate Karaoke Video**
5. Choose save location
6. Wait 3-5 minutes for processing
7. Done!

### Method 2: Online Lookup

1. Click **Browse** and select your MP3 file
2. Select **Lookup online**
3. Artist and title should auto-fill from MP3 metadata
4. Click **Lookup Lyrics**
5. Review lyrics in the text area
6. Choose a background gradient
7. Click **Generate Karaoke Video**
8. Wait 2-4 minutes for processing
9. Done!

### Method 3: Manual Entry

1. Click **Browse** and select your MP3 file
2. Select **Enter manually**
3. Paste or type your lyrics in the text area
4. Choose a background gradient
5. Click **Generate Karaoke Video**
6. Wait 2-4 minutes for processing
7. Done!

## Tips

- **Best Method**: Auto-transcribe is the most reliable (works 95% of the time)
- **Lyrics Lookup**: AZLyrics lookup is often blocked - use Auto-transcribe or Manual instead
- **Better Accuracy**: Auto-transcribe works best with clear vocals
- **Fast Processing**: Use GPU if available (10-15x faster)
- **Custom Backgrounds**: Click "Custom Image" to upload your own background
- **Shorter Songs**: Test with shorter songs (2-3 minutes) first
- **Check Output**: Generated videos are saved as MP4 files

## Troubleshooting

### "FFmpeg not found"
- Install FFmpeg and ensure it's in your system PATH
- Test with: `ffmpeg -version`

### Out of memory
- Close other applications
- Try shorter songs
- Use CPU-only mode (disable CUDA)

### Lyrics not found
- Check artist/title spelling
- Try auto-transcribe instead
- Use manual entry as fallback

### Slow processing
- First run downloads models (one-time)
- Older GPUs may not work - app auto-switches to CPU (see [GPU_TROUBLESHOOTING.md](GPU_TROUBLESHOOTING.md))
- CPU mode: 6-8 minutes for 4-minute song
- Compatible GPU: 1.5-2 minutes for 4-minute song
- Shorter songs process faster

## Next Steps

- Read the full [README.md](README.md) for detailed information
- Check [CONTRIBUTING.md](CONTRIBUTING.md) if you want to contribute
- Report issues on GitHub

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Open an issue on GitHub
- Review the [CONTRIBUTING.md](CONTRIBUTING.md) for development info

Enjoy creating karaoke videos!
