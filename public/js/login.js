async function login(email, password) {
  try {
    const res = await axios({
      method: "post",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });
    if (res.data.status === "success") {
      showAlert("success", "Logged in succesfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  await login(email, password);
}
document.querySelector(".form").addEventListener("submit", handleFormSubmit);
