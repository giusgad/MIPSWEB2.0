declare const ejs: any;

document.addEventListener('DOMContentLoaded', async () => {

    await renderElementById('app', null);

    document.body.style.opacity = '1';

    Array.from(document.getElementsByClassName('icon')).forEach((icon) => {
        (icon as HTMLElement).style.opacity = '1';
    });
});

async function renderElementById(id: string, data: any) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`No element found: ${id}`);
    element.innerHTML = await render(id, data);
}

async function render(templateName: string, data: any) {
    const template = await fetch(`templates/${templateName}.ejs`).then(res => res.text());
    if (!template) throw new Error(`No template found in "templates/${templateName}.ejs"`);
    return ejs.render(template, data);
}

console.log("ok");