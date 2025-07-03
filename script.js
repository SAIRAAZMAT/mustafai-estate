const firebaseConfig = {
  apiKey: "AIzaSyA93wCNiPzp2c7_uS2omjDM3WJFDPlKKaQ",
  authDomain: "mustafaiestate-2e9c7.firebaseapp.com",
  databaseURL: "https://mustafaiestate-2e9c7-default-rtdb.firebaseio.com",
  projectId: "mustafaiestate-2e9c7",
  storageBucket: "mustafaiestate-2e9c7.firebasestorage.app",
  messagingSenderId: "11456486940",
  appId: "1:11456486940:web:bbb4293ab01351a60ec9d9"
};

const app = initializeApp(firebaseConfig);

let isAdmin = false;

function checkAdminStatus() {
  if (localStorage.getItem('isAdmin') === 'true') {
    isAdmin = true;
    document.getElementById('adminBtn').textContent = '🔓 Logout Admin';
    document.getElementById('addPropertyForm').style.display = 'block';
  } else {
    isAdmin = false;
    document.getElementById('adminBtn').textContent = '🔐 Admin Login';
    document.getElementById('addPropertyForm').style.display = 'none';
    resetForm();
  }
}

function toggleAdmin() {
  if (isAdmin) {
    localStorage.removeItem('isAdmin');
    checkAdminStatus();
    renderProperties();
  } else {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

function closeLogin() {
  document.getElementById('loginModal').style.display = 'none';
}

function loginAdmin() {
  const pwd = document.getElementById('adminPassword').value.trim();
  if (pwd === 'Mustafai@2025') {
    localStorage.setItem('isAdmin', 'true');
    isAdmin = true;
    closeLogin();
    checkAdminStatus();
    renderProperties();
  } else {
    alert('Incorrect password!');
  }
}

function getProperties() {
  const props = localStorage.getItem('properties');
  return props ? JSON.parse(props) : [];
}

function saveProperties(props) {
  localStorage.setItem('properties', JSON.stringify(props));
}

function renderProperties() {
  const container = document.getElementById('propertyContainer');
  container.innerHTML = '';
  const props = getProperties();

  if (props.length === 0) {
    container.innerHTML = '<p style="color:#777; text-align:center;">No properties listed yet.</p>';
    return;
  }

  props.forEach((prop, index) => {
    const card = document.createElement('div');
    card.className = 'property-card';

    const img = document.createElement('img');
    img.src = prop.image;
    img.alt = prop.title;

    const title = document.createElement('h4');
    title.textContent = prop.title;

    const price = document.createElement('p');
    price.style.fontWeight = '700';
    price.textContent = `Price: PKR ${prop.price}`;

    const desc = document.createElement('p');
    desc.textContent = prop.description;

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(desc);

    if (isAdmin) {
      const editDeleteDiv = document.createElement('div');
      editDeleteDiv.className = 'edit-delete';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.title = 'Edit Property';
      editBtn.innerHTML = '✏️';
      editBtn.onclick = () => editProperty(index);

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.title = 'Delete Property';
      delBtn.innerHTML = '🗑️';
      delBtn.onclick = () => deleteProperty(index);

      editDeleteDiv.appendChild(editBtn);
      editDeleteDiv.appendChild(delBtn);
      card.appendChild(editDeleteDiv);
    }

    container.appendChild(card);
  });
}

function submitProperty() {
  const title = document.getElementById('propertyTitle').value.trim();
  const image = document.getElementById('propertyImage').value.trim();
  const price = document.getElementById('propertyPrice').value.trim();
  const description = document.getElementById('propertyDescription').value.trim();
  const editIndex = parseInt(document.getElementById('editIndex').value);

  if (!title || !image || !price || !description) {
    alert('Please fill all fields!');
    return;
  }

  const props = getProperties();
  const newProperty = { title, image, price, description };

  if (editIndex >= 0) {
    props[editIndex] = newProperty;
  } else {
    props.push(newProperty);
  }

  saveProperties(props);
  resetForm();
  renderProperties();
}

function editProperty(index) {
  const props = getProperties();
  const prop = props[index];

  document.getElementById('propertyTitle').value = prop.title;
  document.getElementById('propertyImage').value = prop.image;
  document.getElementById('propertyPrice').value = prop.price;
  document.getElementById('propertyDescription').value = prop.description;
  document.getElementById('editIndex').value = index;

  document.getElementById('addUpdateBtn').textContent = 'Update Property';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function deleteProperty(index) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  const props = getProperties();
  props.splice(index, 1);
  saveProperties(props);
  renderProperties();
}

function cancelEdit() {
  resetForm();
}

function resetForm() {
  document.getElementById('propertyTitle').value = '';
  document.getElementById('propertyImage').value = '';
  document.getElementById('propertyPrice').value = '';
  document.getElementById('propertyDescription').value = '';
  document.getElementById('editIndex').value = '-1';
  document.getElementById('addUpdateBtn').textContent = 'Add Property';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

// On page load
checkAdminStatus();
renderProperties();
