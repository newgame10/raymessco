document.getElementById("service-form").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  function saveData() {
    if(editIndex !== null){
      services[editIndex] = {...services[editIndex], ...data};
      editIndex = null;
    } else {
      services.push({...data, estado:"pendiente"});
    }
    saveServices(); 
    renderServices(); 
    closeModal(); 
    form.reset();
  }

  if(form.foto.files.length > 0){
    const file = form.foto.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      data.foto = reader.result;
      saveData();
    };
    reader.readAsDataURL(file);
  } else {
    saveData();
  }
});
