import { getFiles, getProjectName } from "./files.js";
import { hideForm, showForm, showToast } from "./forms.js";
import { addLoader, removeLoader } from "./loaders.js";
import { getFromStorage, setIntoStorage } from "./utils.js";

declare const JSZip: any;

/** To use the upload platform it is necessary to log in. The system uses JWT authentication, meaning
 * that a JWT token needs to be passed in the headers in the requests that require auth.
 * To upload a project there are three steps:
 * - get authentication: if a token is saved in sessionStorage try using it otherwise log in
 * - select the exam session the student has to submit to
 * - upload the project after asking for confirmation */
(window as any).uploadProjOnClick = async function () {
    try {
        const token = await getAuthToken();
        const session = await showSessionSelector();
        if (
            confirm(
                `Are you sure you want to submit your current project: "${getProjectName()}" to the exam session of ${session.name}?`,
            )
        )
            uploadCurrentProject(token, session);
    } catch (e) {
        console.error(e);
        return;
    }
};

/**If a token is saved in sessionStorage then return it, otherwise show a login form
 * that doesn't get closed until either the user cancels or the login is successful.
 * If the user cancels reject the promise, if the promise is resolved then there has been a successful login.*/
async function getAuthToken(): Promise<string> {
    const token = getFromStorage("session", "jwt-auth");
    if (token) return token;
    return new Promise(async (resolve, reject) => {
        await showForm("unimi-login", undefined, true);
        const form = document.getElementById("forms-bg")?.querySelector("form");
        if (!form) return reject();
        const cancelBtn = form.querySelector("#cancelBtn");
        const loginBtn = form.querySelector("#loginBtn");
        const handleCancel = async () => {
            cleanup();
            await hideForm();
            return reject("user canceled login");
        };
        const handleLogin = async () => {
            addLoader("logging-in");
            const data = new FormData(form);
            try {
                const res = await fetch(
                    "https://api.upload.di.unimi.it/student/login",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            username: `${data.get("username")}@studenti.unimi.it`,
                            password: data.get("password"),
                        }),
                        headers: { "Content-Type": "application/json" },
                    },
                );
                const json = await res.json();
                if (res.ok) {
                    cleanup();
                    await hideForm();
                    setIntoStorage("session", "jwt-auth", json.jwt);
                    return resolve(json.jwt);
                } else {
                    throw new Error(json.message);
                }
            } catch (e) {
                showToast(
                    `Error in authentication (${e}), retry logging in`,
                    4000,
                );
            } finally {
                removeLoader("logging-in");
            }
        };
        const cleanup = () => {
            loginBtn?.removeEventListener("click", handleLogin);
            cancelBtn?.removeEventListener("click", handleCancel);
        };
        loginBtn?.addEventListener("click", handleLogin);
        cancelBtn?.addEventListener("click", handleCancel);
    });
}

/**Show a form with a dropdown that gets populated with the currently open exam sessions.
 * Return the Session selected by the user.*/
async function showSessionSelector(): Promise<Session> {
    return new Promise(async (resolve, reject) => {
        await showForm(
            "unimi-session-selector",
            undefined,
            false,
            undefined,
            false,
        );
        addLoader("getting-sessions");
        let sessions;
        try {
            sessions = await getOpenSessions();
        } catch (e) {
            return reject("Couldn't get open sessions");
        }
        if (!sessions) return reject("Couldn't get open sessions");

        const select = document.getElementById(
            "session-select",
        ) as HTMLSelectElement;
        if (!select) return reject();
        select.innerHTML = "";

        for (const session of sessions) {
            const option = document.createElement("option");
            option.value = session.id.toString();
            option.textContent = session.name;
            select.appendChild(option);
        }
        removeLoader("getting-sessions");
        const confirmBtn = document.getElementById("confirmSessionBtn")!;
        const handleConfirm = async () => {
            await hideForm();
            confirmBtn.removeEventListener("click", handleConfirm);
            return resolve(sessions.find((s) => `${s.id}` === select.value)!);
        };
        confirmBtn.addEventListener("click", handleConfirm);
    });
}

type Session = { id: number; name: string };
/**Request to the upload api the list of open sessions and return it as a simplified list of type `Session`*/
async function getOpenSessions(): Promise<[Session] | null> {
    const res = await fetch(
        "https://api.upload.di.unimi.it/student/listopensessions",
    );
    if (res.ok) {
        const json = await res.json();
        return json.sessions.map((s: any) => {
            return {
                id: s.ID,
                name: s.Course.NOMECORSO,
            };
        });
    }
    return null;
}

/**Creates the zip file containing the current project, encase it in formData, and send the request
 * to the upload api to submit the project to the given session with the given jwt-token in the headers*/
async function uploadCurrentProject(jwtToken: string, session: Session) {
    const zip = new JSZip();
    for (const file of getFiles()) {
        if (!file.name.endsWith(".asm")) file.name = `${file.name}.asm`;
        zip.file(file.name, file.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });

    const formData = new FormData();
    formData.append(
        "file",
        new File([blob], `${getProjectName()}.zip`, {
            type: "application/zip",
        }),
    );

    const res = await fetch(
        `https://api.upload.di.unimi.it/student/upload/${session.id}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                Accept: "application/json, text/plain, */*",
            },
            body: formData,
        },
    );
    const json = await res.json();
    if (res.ok) {
        showToast(`${json.message} to the session: ${session.name}`, 5000);
    } else {
        sessionStorage.removeItem("jwt-auth");
        showToast(
            `Something went wrong with the upload: ${json.message}`,
            4000,
        );
    }
}
