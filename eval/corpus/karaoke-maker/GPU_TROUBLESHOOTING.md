# GPU Troubleshooting

## CUDA Error: No Kernel Image Available

If you see this error:
```
CUDA error: no kernel image is available for execution on the device
```

This means your GPU is too old for the version of PyTorch installed.

### The Problem

- PyTorch 2.0+ requires CUDA compute capability **7.0 or higher**
- Older GPUs (like Quadro M1000M with capability 5.0) are not supported
- PyTorch tries to use the GPU and fails

### The Solution

The app now **automatically detects** incompatible GPUs and switches to CPU mode. Just run normally:

```bash
./run.sh
```

The app will:
1. Detect your GPU
2. Check if it's compatible
3. Automatically use CPU if needed
4. Print a message like: "GPU detected (capability 5.0) but incompatible with PyTorch - Using CPU mode"

### Manual Override (If Needed)

If you still see GPU errors, force CPU mode manually:

```bash
export CUDA_VISIBLE_DEVICES=-1
./run.sh
```

Or edit `run.sh` and add at the top:
```bash
export CUDA_VISIBLE_DEVICES=-1
```

### Performance Impact

**With incompatible GPU (using CPU)**:
- Vocal conversion: ~2-3 min
- Transcription: ~3-4 min
- Video rendering: ~1 min
- **Total: ~6-8 minutes for a 4-minute song**

**With compatible GPU (CUDA 7.0+)**:
- Vocal conversion: ~30 sec
- Transcription: ~30 sec
- Video rendering: ~30 sec
- **Total: ~1.5-2 minutes for a 4-minute song**

### GPU Compatibility List

**Compatible GPUs** (CUDA capability >= 7.0):
- NVIDIA GTX 1660 and newer
- NVIDIA RTX 20xx series and newer
- NVIDIA Tesla V100 and newer
- NVIDIA Quadro RTX series

**Incompatible GPUs** (CUDA capability < 7.0):
- NVIDIA GTX 900 series (Maxwell)
- NVIDIA GTX 10xx series (some models)
- NVIDIA Quadro M series (M1000M, M2000M, etc.)
- NVIDIA Tesla K series

### Check Your GPU

To check your GPU's compute capability:

```bash
source venv/bin/activate
python3 -c "import torch; print(f'GPU: {torch.cuda.get_device_name(0)}'); print(f'Capability: {torch.cuda.get_device_capability(0)}')"
```

### Alternative: Install Older PyTorch

If you want to use your older GPU, you could install PyTorch 1.13 (last version supporting CUDA 5.0):

```bash
pip uninstall torch torchaudio
pip install torch==1.13.1 torchaudio==0.13.1
```

**Warning**: This may cause compatibility issues with other packages. Not recommended.

### Recommended Approach

**Just use CPU mode** - it works fine! The app is designed to work well on CPU. Processing takes a few extra minutes, but the quality is identical.

## Other GPU Issues

### "CUDA out of memory"

If you get OOM errors:
1. Close other GPU applications
2. Process shorter songs
3. Use CPU mode instead: `export CUDA_VISIBLE_DEVICES=-1`

### "CUDA initialization failed"

Try:
```bash
export CUDA_VISIBLE_DEVICES=-1
./run.sh
```

### Multiple GPUs

To use a specific GPU:
```bash
export CUDA_VISIBLE_DEVICES=0  # Use GPU 0
# or
export CUDA_VISIBLE_DEVICES=1  # Use GPU 1
```

## Verification

After fixing, run the test script:

```bash
source venv/bin/activate
python3 test_setup.py
```

Look for the GPU section - it should show either:
- "✓ GPU is compatible and will be used for acceleration!"
- "⚠ WARNING: GPU capability X.X is incompatible - The app will automatically use CPU mode"

Both are fine! The app will work either way.

## Still Having Issues?

1. **Force CPU mode**: `export CUDA_VISIBLE_DEVICES=-1`
2. **Run test**: `python3 test_setup.py`
3. **Check logs**: Look for "Using CPU mode" messages
4. **Report bug**: If CPU mode still fails, open an issue on GitHub
