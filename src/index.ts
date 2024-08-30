document.addEventListener('DOMContentLoaded', async () => {

    await render('app');

});

async function render(templateName: string) {
    const element = document.getElementById(templateName);
    if (element) {
        const template = await fetch(`templates/${templateName}.ejs`).then(res => res.text());
        if (template) {
            element.innerHTML = ejs.render(template);
        } else {
            console.error(`No template found: templates/${templateName}.ejs`);
        }
    } else {
        console.error(`No element found: ${templateName}`);
    }
}