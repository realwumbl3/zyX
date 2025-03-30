import { html } from "../../../v:1.8/";

const content = html`<h2>Content</h2>`;

const callback = () => {
  console.log("Button Clicked");
};

const testHTML = html`
  <div>
    <h1 this="h1" zyx-click=${callback}>Pre-parse test HTML</h1>
    <div id="content">"${content}"</div>
  </div>
`.const({ keepRaw: true, keepMarkup: true });

console.log({ testHTML });

testHTML.place(document.getElementById("app"));
