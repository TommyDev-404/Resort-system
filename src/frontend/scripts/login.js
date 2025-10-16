
const input = document.querySelector('input[name="password"]');


/*---------------- LOGIN EVENT LISTENER ----------------*/
// remove password icon & show eye icon
input.addEventListener('input', (e) => {
      const img = document.querySelector('.passField img');
      console.log(e.target.value);
      if (e.target.value != ''){
            img.src = '/assets/eye.png';
            img.setAttribute('id', 'show');
      }else {
            e.target.setAttribute('type', 'password');
            img.src = '/assets/pass.png';
            img.setAttribute('id', 'ps-icon');
      }
});

// toggle view password with dynamic icon
document.addEventListener('click', (e) => {
      if (e.target.matches('#show')){
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            e.target.src = type === "password" ? '/assets/eye.png' : '/assets/hidden.png';
      }
});

