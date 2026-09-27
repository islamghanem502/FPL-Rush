import toast from 'react-hot-toast';

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  } catch {
    toast.error('تعذر النسخ — انسخه يدويًا');
  }
};
