fetch('/api/user', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(user => {
    document.getElementById("user-avatar").src = user.avatar_url || "default.png";
    document.getElementById("user-name").textContent = user.username || "@undefined";
    document.getElementById("user-roles").textContent = user.roles && user.roles.length > 0 ? user.roles.join(", ") : "No roles";
    if(document.getElementById("user-votes")) {
      document.getElementById("user-votes").textContent = user.remaining_votes || "0";
    }
  })
  .catch(() => {
    document.getElementById("user-name").textContent = "Desconocido";
    document.getElementById("user-roles").textContent = "No roles";
  });
