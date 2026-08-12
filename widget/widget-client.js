(function () {
  "use strict";

  // ----------------------------------------
  // Detect the script that loaded this widget
  // ----------------------------------------

  const currentScript = document.currentScript;

  if (!currentScript) {
    console.error("FlyRank Widget: Unable to detect script element.");
    return;
  }

  const scriptUrl = new URL(currentScript.src);

  // Widget ID comes from:
  // /widget.js?id=1&v=1
  const widgetId = scriptUrl.searchParams.get("id");

  if (!widgetId) {
    console.error("FlyRank Widget: Missing widget ID.");
    return;
  }

  // ----------------------------------------
  // API base URL
  // ----------------------------------------

  const apiBaseUrl = scriptUrl.origin;

  // ----------------------------------------
  // Load widget configuration
  // ----------------------------------------

  fetch(
    `${apiBaseUrl}/api/widgets/${encodeURIComponent(widgetId)}/config`
  )
    .then(function (response) {
      if (!response.ok) {
        throw new Error(
          `Widget configuration request failed: ${response.status}`
        );
      }

      return response.json();
    })
    .then(function (config) {
      renderWidget(config);
    })
    .catch(function (error) {
      console.error(
        "FlyRank Widget: Failed to load configuration.",
        error
      );
    });

  // ----------------------------------------
  // Render widget
  // ----------------------------------------

  function renderWidget(config) {
    const container = document.createElement("div");

    container.id = `flyrank-widget-${config.id}`;

    container.innerHTML = `
      <div style="
        max-width: 420px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        background: #ffffff;
      ">

        <h3 style="margin-top: 0;">
          ${escapeHtml(config.name)}
        </h3>

        <form id="flyrank-form-${config.id}">

          <div style="margin-bottom: 12px;">
            <label for="flyrank-name-${config.id}">
              Name
            </label>

            <input
              id="flyrank-name-${config.id}"
              name="name"
              type="text"
              required
              style="
                width: 100%;
                padding: 8px;
                margin-top: 4px;
                box-sizing: border-box;
              "
            />
          </div>

          <div style="margin-bottom: 12px;">
            <label for="flyrank-email-${config.id}">
              Email
            </label>

            <input
              id="flyrank-email-${config.id}"
              name="email"
              type="email"
              required
              style="
                width: 100%;
                padding: 8px;
                margin-top: 4px;
                box-sizing: border-box;
              "
            />
          </div>

          <div style="margin-bottom: 12px;">
            <label for="flyrank-message-${config.id}">
              Message
            </label>

            <textarea
              id="flyrank-message-${config.id}"
              name="message"
              rows="4"
              style="
                width: 100%;
                padding: 8px;
                margin-top: 4px;
                box-sizing: border-box;
              "
            ></textarea>
          </div>

          <!-- Honeypot field -->
          <div style="
            position: absolute;
            left: -9999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
          ">
            <label>
              Website

              <input
                type="text"
                name="website"
                tabindex="-1"
                autocomplete="off"
              />
            </label>
          </div>

          <button
            type="submit"
            style="
              padding: 10px 18px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            "
          >
            Submit
          </button>

          <div
            id="flyrank-status-${config.id}"
            style="margin-top: 12px;"
          ></div>

        </form>
      </div>
    `;

    // ----------------------------------------
    // Insert widget after script element
    // ----------------------------------------

    currentScript.parentNode.insertBefore(
      container,
      currentScript.nextSibling
    );

    // ----------------------------------------
    // Handle form submission
    // ----------------------------------------

    const form = document.getElementById(
      `flyrank-form-${config.id}`
    );

    const status = document.getElementById(
      `flyrank-status-${config.id}`
    );

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(form);

      const payload = {
        widget_id: Number(config.id),
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
        website: formData.get("website")
      };

      status.textContent = "Submitting...";

      fetch(`${apiBaseUrl}/api/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return {
              status: response.status,
              data: data
            };
          });
        })
        .then(function (result) {
          if (result.status === 201) {
            status.textContent =
              "Submission received successfully.";

            form.reset();

            return;
          }

          status.textContent =
            result.data.error || "Submission failed.";
        })
        .catch(function (error) {
          console.error(
            "FlyRank Widget: Submission failed.",
            error
          );

          status.textContent =
            "Unable to submit. Please try again.";
        });
    });
  }

  // ----------------------------------------
  // Basic HTML escaping
  // ----------------------------------------

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();