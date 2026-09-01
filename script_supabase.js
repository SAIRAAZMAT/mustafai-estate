const SUPABASE_URL = 'https://lmmhfsdjhnyeqdejrcuj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QfhzgCKgq6WKeZ8uGK9ZmQ__QHJTeN0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isAdmin = false;
let propertiesCache = [];
let editingImageUrl = '';

async function checkAdminStatus() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  isAdmin = !!session;
  document.getElementById('adminBtn').textContent = isAdmin ? '🔓 Logout Admin' : '🔐 Admin Login';
  document.getElementById('addPropertyForm').style.display = isAdmin ? 'block' : 'none';
}

async function toggleAdmin() {
  if (isAdmin) {
    await supabaseClient.auth.signOut();
    resetForm();
    await checkAdminStatus();
    renderProperties();
  } else {
    document.getElementById('loginModal').style.display = 'flex';
  }
}

function closeLogin() {
  document.getElementById('loginModal').style.display = 'none';
}

async function loginAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;

  if (!email || !password) {
    alert('Please enter email and password.');
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert('Login failed: ' + error.message);
    return;
  }

  closeLogin();
  await checkAdminStatus();
  renderProperties();
}

async function loadProperties() {
  const { data, error } = await supabaseClient
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    document.getElementById('propertyContainer').innerHTML =
      '<p style="color:#c00;text-align:center;">Could not load properties.</p>';
    return;
  }

  propertiesCache = data || [];
  renderProperties();
}

function renderProperties() {
  const container = document.getElementById('propertyContainer');
  container.innerHTML = '';

  if (propertiesCache.length === 0) {
    container.innerHTML = '<p style="color:#777;text-align:center;">No properties listed yet.</p>';
    return;
  }

  propertiesCache.forEach((prop) => {
    const card = document.createElement('div');
    card.className = 'property-card';

    const img = document.createElement('img');
    img.src = prop.image_url;
    img.alt = prop.title || 'Property image';

    const title = document.createElement('h4');
    title.textContent = prop.title;

    const price = document.createElement('p');
    price.style.fontWeight = '700';
    price.textContent = `Price: PKR ${prop.price}`;

    const desc = document.createElement('p');
    desc.className = 'property-card-description';
    desc.textContent = prop.description;

    card.append(img, title, price, desc);

    if (isAdmin) {
      const actions = document.createElement('div');
      actions.className = 'edit-delete';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '✏️';
      editBtn.onclick = () => editProperty(prop.id);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.onclick = () => deleteProperty(prop.id);

      actions.append(editBtn, deleteBtn);
      card.appendChild(actions);
    }

    container.appendChild(card);
  });
}

async function submitProperty() {
  const title = document.getElementById('propertyTitle').value.trim();
  const imageInput = document.getElementById('propertyImage');
  const price = document.getElementById('propertyPrice').value.trim();
  const description = document.getElementById('propertyDescription').value.trim();
  const editId = document.getElementById('editIndex').value;

  if (!title || !price || !description) {
    alert('Please fill all fields.');
    return;
  }

  let imageUrl = editingImageUrl;

  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please choose a valid image.');
      return;
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('property-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      alert('Image upload failed: ' + uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabaseClient
      .storage
      .from('property-images')
      .getPublicUrl(fileName);

    imageUrl = publicUrlData.publicUrl;
  }

  if (!imageUrl) {
    alert('Please choose a property image.');
    return;
  }

  const propertyData = { title, price, description, image_url: imageUrl };
  let error;

  if (editId) {
    ({ error } = await supabaseClient.from('properties').update(propertyData).eq('id', editId));
  } else {
    ({ error } = await supabaseClient.from('properties').insert([propertyData]));
  }

  if (error) {
    alert('Property could not be saved: ' + error.message);
    return;
  }

  resetForm();
  await loadProperties();
  alert(editId ? 'Property updated successfully.' : 'Property added successfully.');
}

function editProperty(id) {
  const prop = propertiesCache.find(p => p.id === id);
  if (!prop) return;

  document.getElementById('propertyTitle').value = prop.title || '';
  document.getElementById('propertyImage').value = '';
  document.getElementById('propertyPrice').value = prop.price || '';
  document.getElementById('propertyDescription').value = prop.description || '';
  document.getElementById('editIndex').value = prop.id;

  editingImageUrl = prop.image_url || '';
  showImagePreview(editingImageUrl);

  document.getElementById('addUpdateBtn').textContent = 'Update Property';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

async function deleteProperty(id) {
  if (!confirm('Are you sure you want to delete this property?')) return;

  const { error } = await supabaseClient.from('properties').delete().eq('id', id);
  if (error) {
    alert('Property could not be deleted: ' + error.message);
    return;
  }

  await loadProperties();
}

function cancelEdit() {
  resetForm();
}

function resetForm() {
  document.getElementById('propertyTitle').value = '';
  document.getElementById('propertyImage').value = '';
  document.getElementById('propertyPrice').value = '';
  document.getElementById('propertyDescription').value = '';
  document.getElementById('editIndex').value = '';
  document.getElementById('addUpdateBtn').textContent = 'Add Property';
  document.getElementById('cancelEditBtn').style.display = 'none';
  editingImageUrl = '';
  hideImagePreview();
}

function showImagePreview(src) {
  document.getElementById('imagePreview').src = src;
  document.getElementById('imagePreviewContainer').style.display = 'block';
}

function hideImagePreview() {
  document.getElementById('imagePreview').src = '';
  document.getElementById('imagePreviewContainer').style.display = 'none';
}

document.getElementById('propertyImage').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please choose an image file.');
    this.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = e => showImagePreview(e.target.result);
  reader.readAsDataURL(file);
});

(async function init() {
  await checkAdminStatus();
  await loadProperties();
})();
