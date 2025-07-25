#!/bin/bash

# Script untuk mengunduh model-model ComfyUI dan Workflows

# --- Meminta API Key dari pengguna ---
echo "Skrip ini memerlukan API Key Hugging Face untuk melanjutkan."
read -sp "Masukkan API Key (input tidak akan terlihat): " HF_TOKEN
echo
echo "Terima kasih. Memulai proses download..."
# ----------------------------------------------------

# 1. Unet Loader (GGUF)
echo "Mengunduh Unet Loader..."
cd ~/ComfyUI/models/diffusion_models/
wget --header="Authorization: Bearer $HF_TOKEN" -O flux1-dev-Q8_0.gguf "https://huggingface.co/city96/FLUX.1-dev-gguf/resolve/main/flux1-dev-Q8_0.gguf?download=true"

# 2. Dual Clip Loader (GGUF) 1
echo "Mengunduh Dual Clip Loader 1..."
cd ~/ComfyUI/models/clip/
wget --header="Authorization: Bearer $HF_TOKEN" -O t5-v1_1-xxl-encoder-Q8_0.gguf "https://huggingface.co/city96/t5-v1_1-xxl-encoder-gguf/resolve/main/t5-v1_1-xxl-encoder-Q8_0.gguf?download=true"

# 3. Dual Clip Loader (GGUF) 2
echo "Mengunduh Dual Clip Loader 2..."
cd ~/ComfyUI/models/clip/
wget --header="Authorization: Bearer $HF_TOKEN" -O clip_l.safetensors "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors?download=true"

# 4. VAE
echo "Mengunduh VAE..."
cd ~/ComfyUI/models/vae/
wget --header="Authorization: Bearer $HF_TOKEN" -O ae.safetensors "https://huggingface.co/Comfy-Org/Lumina_Image_2.0_Repackaged/resolve/main/split_files/vae/ae.safetensors?download=true"

# 5. Power Lora Loader
echo "Mengunduh Power Lora..."
cd ~/ComfyUI/models/loras/
wget --header="Authorization: Bearer $HF_TOKEN" -O svg_style.safetensors "https://huggingface.co/Pixaroma/flux-kontext-loras/resolve/main/svg_style.safetensors?download=true"

# 6. Upscale Model
echo "Mengunduh Upscale Model..."
cd ~/ComfyUI/models/upscale_models/
wget --header="Authorization: Bearer $HF_TOKEN" -O 4x_NMKD-Siax_200k.pth "https://huggingface.co/Akumetsu971/SD_Anime_Futuristic_Armor/resolve/main/4x_NMKD-Siax_200k.pth?download=true"

# 7. Workflows dari Google Drive - BARU
echo "Mengunduh Workflows dari Google Drive..."
# Cek apakah gdown terinstal, jika tidak, instal
if ! command -v gdown &> /dev/null
then
    echo "gdown tidak ditemukan. Menginstal gdown..."
    pip install gdown
fi

# Buat folder tujuan jika belum ada (memperbaiki # menjadi /)
mkdir -p ~/ComfyUI/user/default/workflows/

# Pindah ke folder tujuan
cd ~/ComfyUI/user/default/workflows/

# Unduh isi folder dari Google Drive
echo "Menggunakan gdown untuk mengunduh folder. Ini mungkin memakan waktu..."
gdown --folder https://drive.google.com/drive/folders/1JHfICU8GMAW8KBhhrl46phIbc-Scacux

# Selesai
echo "Semua file berhasil diunduh."
cd ~/
