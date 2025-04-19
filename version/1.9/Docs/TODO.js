
html`<div this=container zyx-paginator>
    <div this=a></div>
    <div this=b></div>
</div>`

this.container.paginator.show("a")

html`<div this="container" zyx-slots></div>`;

this.container.slots.show(this.settings);
