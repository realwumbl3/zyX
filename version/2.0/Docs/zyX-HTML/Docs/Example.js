// Example usage of zyX-HTML

// Example 1: Basic template with dynamic content
const title = 'Welcome';
const content = 'This is dynamic content';
const template = html`
  <div class="container">
    <h1>${title}</h1>
    <p>${content}</p>
  </div>
`;
template.appendTo(document.body);

// Example 2: Dynamic attributes and event handling
const className = 'highlight';
const handleClick = () => console.log('Clicked!');
const buttonTemplate = html`
  <button 
    class="${className}"
    onclick="${handleClick}"
    data-id="${123}"
  >
    Click me
  </button>
`;
buttonTemplate.appendTo(document.body);

// Example 3: Element references
const formTemplate = html`
  <form id="loginForm">
    <input type="text" id="username" />
    <input type="password" id="password" />
    <button id="submit">Login</button>
  </form>
`;
const form = formTemplate.const();
form.submit.addEventListener('click', () => {
  console.log('Username:', form.username.value);
  console.log('Password:', form.password.value);
});
form.appendTo(document.body);

// Example 4: Reactive data binding
const reactiveData = {
  value: 'Initial',
  subscribe: (callback) => {
    callback(reactiveData.value);
    return () => {}; // Cleanup function
  }
};
const reactiveTemplate = html`
  <div ${reactiveData}>
    <p>Current value: ${reactiveData.value}</p>
    <button onclick="${() => reactiveData.value = 'Updated'}">
      Update
    </button>
  </div>
`;
reactiveTemplate.appendTo(document.body);

// Example 5: Template composition
const header = html`<header>Header</header>`;
const footer = html`<footer>Footer</footer>`;
const mainContent = html`
  <main>
    <h2>Main Content</h2>
    <p>This is the main content area</p>
  </main>
`;
const pageTemplate = html`
  <div class="page">
    ${header}
    ${mainContent}
    ${footer}
  </div>
`;
pageTemplate.appendTo(document.body);

// Example 6: Dynamic list rendering
const items = ['Item 1', 'Item 2', 'Item 3'];
const listTemplate = html`
  <ul>
    ${items.map(item => html`<li>${item}</li>`)}
  </ul>
`;
listTemplate.appendTo(document.body); 