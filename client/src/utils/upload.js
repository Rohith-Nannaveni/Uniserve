import axios from "axios";

const upload = async (file) => {
  const data = new FormData();
  data.append("file", file);
  // Cloudinary credentials pulled exclusively from .env
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_NAME;
  
  data.append("upload_preset", uploadPreset);

  try {
    const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, data);
    const { secure_url } = res.data;
    return secure_url;
  } catch (err) {
    console.log(err);
  }
};

export default upload;
