const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
  window.setTimeout(hideAlert, 5000);
};

const hideAlert = () => {
  const el = document.querySelector(".alert");
  if (el) el.parentElement.removeChild(el);
};

async function logout() {
  try {
    const res = await axios({
      method: "get",
      url: "/api/v1/users/logout",
    });
    if (res.data.status === "success") {
      showAlert("success", "Logged out succesfully");
      window.setTimeout(() => {
        location.reload(true);
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
}

async function handleLogout(e) {
  e.preventDefault();
  await logout();
}

const logoutBtn = document.querySelector(".nav__el--logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", handleLogout);
}
