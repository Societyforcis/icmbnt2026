export const submitPaper = async (formData: FormData) => {
  try {
    const response = await fetch('http://localhost:5000/submit-paper', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit paper');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting paper:', error);
    throw error;
  }
};