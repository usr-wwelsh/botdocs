# Building Path of Python - Windows Executable

This document explains how to build Path of Python into a standalone Windows executable.

## Quick Start

1. **Install PyInstaller** (if not already installed):
   ```bash
   pip install pyinstaller
   ```

2. **Run the build script**:
   ```bash
   build.bat
   ```

3. **Find your executable**:
   - Location: `dist/PathOfPython.exe`
   - This is a single-file executable with all resources bundled

## How It Works

### Architecture Overview

The build system uses three key components:

1. **`utility/resource_path.py`** - Detects if running bundled or in dev mode
2. **`path_of_python.spec`** - PyInstaller configuration that bundles everything
3. **`build.bat`** - Automated build script

### What Gets Bundled

The executable includes:
- ✅ All Python code (core, ui, entities, combat, etc.)
- ✅ All graphics assets (sprites, tiles, UI elements)
- ✅ All data files (JSON configs, quests, scenes)
- ✅ All audio files (music, sound effects)
- ✅ Python runtime and dependencies (pygame, etc.)

### Why It Works Now

**Previous issues you likely encountered:**

1. **"Module not found" errors** → Fixed by explicit `hiddenimports` list in spec file
2. **"File not found" errors** → Fixed by bundling all data directories
3. **Dynamic imports failing** → Fixed by explicitly listing all scene modules
4. **Wrong file paths** → Would be fixed by using `resource_path()` helper (optional)

**Current approach:**
- NO changes needed to game logic
- PyInstaller spec file handles all the complexity
- All resources are bundled and accessible

## Advanced Options

### Console vs Windowed Mode

In `path_of_python.spec`, find this line:
```python
console=False,  # Set to True for debugging, False for release
```

- `console=True` - Shows console window (useful for debugging build issues)
- `console=False` - No console window (clean for distribution)

### Adding an Icon

1. Create or obtain a `.ico` file
2. In `path_of_python.spec`, change:
   ```python
   icon=None,  # Add icon='path/to/icon.ico' if you have one
   ```
   to:
   ```python
   icon='graphics/icon.ico',  # or wherever your icon is
   ```

### Reducing File Size

The exe might be large (~200-400 MB) due to pygame and dependencies. To reduce:

1. **Enable UPX compression** (already enabled):
   ```python
   upx=True,
   ```

2. **Exclude unnecessary packages** (already configured):
   ```python
   excludes=['tests', 'matplotlib', 'tkinter', ...]
   ```

3. **Use one-folder mode** (instead of one-file) - faster but less portable:
   In spec file, change `EXE()` to not include all data in one file

## Troubleshooting

### "Module not found" errors when running exe

**Solution:** Add the missing module to `hiddenimports` in `path_of_python.spec`

Example:
```python
hiddenimports = [
    # ... existing imports ...
    'your.missing.module',
]
```

### "File not found" errors for resources

**Solution:** Add the directory to `data_files` in `path_of_python.spec`

Example:
```python
data_files = [
    # ... existing files ...
    ('new_folder', 'new_folder'),
]
```

### Executable is too large

**Solutions:**
1. Remove unused asset files before building
2. Compress audio files (use .ogg instead of .wav)
3. Use one-folder distribution instead of one-file
4. Remove unused dependencies

### Game works in dev but crashes when bundled

**Debugging steps:**
1. Build with `console=True` in spec file to see error messages
2. Check that all resources are being bundled
3. Verify no absolute paths are hardcoded in game code
4. Test on a clean Windows install (or VM without Python)

## Distribution

Once built, you can distribute:

**Option 1: Single File (default)**
- Just share `dist/PathOfPython.exe`
- Users run the exe, no installation needed
- Resources are extracted to temp folder on launch

**Option 2: One Folder (if modified to do so)**
- Share the entire `dist/` folder
- Users run `PathOfPython.exe` from the folder
- Faster startup, but more files to distribute

**Recommended:** Add a README.txt explaining:
- System requirements (Windows 10/11, DirectX)
- How to run (just double-click the exe)
- Known issues or controls

## Future Development

When adding new features:

1. **New Python files** - PyInstaller will auto-detect most imports
2. **New dynamically-loaded modules** - Add to `hiddenimports` in spec
3. **New asset folders** - Add to `data_files` in spec
4. **New dependencies** - Install them, PyInstaller will bundle automatically

To rebuild after changes:
```bash
build.bat
```

That's it! The build system is set up for easy iteration.
