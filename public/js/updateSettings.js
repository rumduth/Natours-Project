//update data
async function handleUpdateData(e) {
  e.preventDefault();
  try {
    const formData = new FormData(e.target);
    const res = await axios.patch(
      `http://localhost:3000/api/v1/users/updateMe`,
      formData
    );
    if (res.data.status === "success") {
      setTimeout(() => location.reload(true), 1500);
      showAlert("success", "Settings updated succesfully");
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
}

async function handleUpdatePassword(e) {
  e.preventDefault();
  try {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const res = await axios({
      method: "PATCH",
      url: "http://localhost:3000/api/v1/users/updateMyPassword",
      data,
    });
    if (res.data.status === "success") {
      setTimeout(() => location.reload(true), 1500);
      showAlert("success", "Password updated succesfully");
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
}

document
  .querySelector(".form-user-data")
  .addEventListener("submit", handleUpdateData);
document
  .querySelector(".form-user-settings")
  .addEventListener("submit", handleUpdatePassword);
