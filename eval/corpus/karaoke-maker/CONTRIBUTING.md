# Contributing to Karaoke Maker

Thank you for your interest in contributing to Karaoke Maker! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/karaoke-maker.git
   cd karaoke-maker
   ```
3. Run the setup script:
   ```bash
   ./setup.sh  # Linux/macOS
   # or
   setup.bat   # Windows
   ```

## Development Setup

### Prerequisites
- Python 3.8 or higher
- FFmpeg installed and in PATH
- Git

### Setting Up Development Environment

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   venv\Scripts\activate.bat # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python main.py
   ```

## Project Structure

```
karaoke-maker/
├── main.py                 # Main GUI application (CustomTkinter)
├── audio_processor.py      # Demucs vocal separation
├── lyrics_handler.py       # Whisper transcription + azapi lookup
├── alignment.py            # Forced alignment for lyrics
├── video_renderer.py       # FFmpeg video generation
├── utils.py                # Metadata extraction, helpers
├── requirements.txt        # Python dependencies
├── assets/                 # Default backgrounds, fonts
├── packaging/              # Distribution configs
│   ├── pyinstaller.spec    # Windows .exe
│   └── flatpak/            # Linux Flatpak
└── tests/                  # Unit tests (to be added)
```

## Code Style

- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Add docstrings to functions and classes
- Keep functions focused and single-purpose
- Use meaningful variable names

### Example:

```python
def process_audio(input_path: str, output_dir: str) -> Tuple[str, str]:
    """
    Process audio file and separate vocals.

    Args:
        input_path: Path to input audio file
        output_dir: Directory for output files

    Returns:
        Tuple of (vocals_path, instrumental_path)
    """
    # Implementation here
    pass
```

## Testing

Currently, the project uses manual testing. Automated tests are welcome contributions!

To test manually:
1. Run the application
2. Test with various MP3 files
3. Try all three lyrics modes (Auto, Lookup, Manual)
4. Verify output video quality
5. Test error handling (invalid files, missing dependencies, etc.)

## Submitting Changes

1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes:
   - Write clear, concise commit messages
   - Test your changes thoroughly
   - Update documentation if needed

3. Commit your changes:
   ```bash
   git add .
   git commit -m "Add feature: description of changes"
   ```

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes clearly
   - Reference any related issues

## Pull Request Guidelines

- **Title**: Clear, descriptive title (e.g., "Add support for custom fonts")
- **Description**: Explain what changes you made and why
- **Testing**: Describe how you tested your changes
- **Documentation**: Update README.md or other docs if needed
- **Code Quality**: Follow existing code style and patterns

## Areas for Contribution

Here are some areas where contributions are particularly welcome:

### Features
- [ ] Additional background effects (animations, particles)
- [ ] Multiple font support
- [ ] Text size/color customization
- [ ] Video resolution options
- [ ] LRC file import/export
- [ ] Batch processing
- [ ] Video preview before export
- [ ] Multiple language support for Whisper
- [ ] Karaoke timing adjustment (offset, speed)

### Improvements
- [ ] Better lyrics alignment algorithm
- [ ] Optimized video rendering
- [ ] Progress bar accuracy
- [ ] Error handling and user feedback
- [ ] Memory usage optimization
- [ ] GPU acceleration improvements

### Testing
- [ ] Unit tests for each module
- [ ] Integration tests
- [ ] Performance benchmarks
- [ ] Cross-platform testing

### Documentation
- [ ] Video tutorials
- [ ] More examples in README
- [ ] API documentation
- [ ] Troubleshooting guide expansion

### Packaging
- [ ] Windows installer (.exe)
- [ ] Linux Flatpak
- [ ] macOS .app bundle
- [ ] Homebrew formula
- [ ] Snap package

## Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: How to trigger the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - OS and version
   - Python version
   - FFmpeg version
   - GPU (if applicable)
6. **Error Messages**: Full error output
7. **Sample File**: If possible, include a sample MP3 (or link)

## Feature Requests

For feature requests, please:

1. Check if it's already been requested
2. Describe the feature clearly
3. Explain the use case
4. Suggest implementation approach (optional)

## Code Review Process

1. Maintainers will review your PR
2. Feedback may be provided for improvements
3. Once approved, your PR will be merged
4. You'll be credited in the commit and contributors list

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make Karaoke Maker better for everyone!
