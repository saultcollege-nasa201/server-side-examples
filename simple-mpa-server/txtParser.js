// This code takes our simple txt format and converts it into valid HTML

const fs = require("fs/promises");

async function toHtml(txt, context) {
    txt = txt.trim();
    const title = getTitle(txt);

    const content = await toHtmlContent(txt, context);

    return context.template.replace("%TITLE%", title).replace("%CONTENT%", content);
}


// This function extracts the first level 1 heading of the text and uses it as the title
function getTitle(txt) {
    if ( txt.startsWith("# ") ) {
        return txt.slice(2, txt.indexOf("\n"));
    } else {
        return "Untitled";
    }
}

async function toHtmlContent(txt, context) {

    const lines = txt.split("\n");

    let content = "";
    let inList = false;

    for (let line of lines) {
        line = line.trim();

        if ( inList && !line.startsWith("- ") ) {
            content += '</ul>';
            inList = false;
        }

        if ( line.startsWith("# ") ) {
            content += `<h1>${line.slice(2)}</h1>`;
        } else if ( line.startsWith("## ") ) {
            content += `<h2>${line.slice(3)}</h2>`;
        } else if ( line.startsWith("### ") ) {
            content += `<h3>${line.slice(4)}</h3>`;
        } else if ( line.startsWith("- ") ) {
            if ( ! inList ) {
                content += '<ul>';
                inList = true;
            }
            content += `<li>${line.slice(2)}</li>`;
        } else if ( line.startsWith("@") ) {
            const folder = line.slice(1);
            const pages = await context.getPagesInFolder(folder);

            content += "<ul>";
            for (let page of pages) {
                let linkText = page;
                linkText = linkText.replace(".txt", "");  // Remove the .txt extension
                linkText = linkText.replace(/-/g, " ");   // Replace dashes with spaces
                linkText = linkText.slice(11);        // Remove the date prefix
                // Capitalize the first letter
                linkText = linkText.charAt(0).toUpperCase() + linkText.slice(1);
                content += `<li><a href="${folder}/${page}">${linkText}</a></li>`;
            }
            content += "</ul>";
        } else if ( line !== "" ) {
            content += `<p>${line}</p>`;
        }

        // Now do inline elements, i.e. **bold** and *italic*
        content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
        
        // Process hyperlinks, i.e. [text](url)
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2'>$1</a>");
    }

    return content;
}

module.exports = { toHtml };