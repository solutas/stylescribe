const RESERVED_WORDS = ['cssVars'];

exports.extractAnnotations = function (content) {
    const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);

    if (commentMatch) {
        const commentContent = commentMatch[1];
        const annotationRegExp = /@(\w+)([^@]*)/gs;
        // const annotationRegExp = /(^|\n)\s*@(\w+)([^@]*)/gs;

        let match;
        let annotationsObj = {};

        while ((match = annotationRegExp.exec(commentContent)) !== null) {
            const key = match[1];
            let value = match[2].trim();

            // Check if the key is a reserved word
            if (RESERVED_WORDS.includes(key)) {
                throw new Error(`The key "${key}" is a reserved word and cannot be used as an annotation.`);
            }

            // Clean up the value
            value = value.replace(/\n\s*\*/g, '\n').trim();

            // Check for new format when the key ends with 's'
            if (key.endsWith('s') && value.startsWith('-')) {
                let items = [];
                const itemEntryRegex = /-\s+([\s\S]*?)(?=-\s|$)/g; // Captures each item's content
                // const keyValueRegex = /(\w+):\s*([\s\S]*?)(?=\w+:|$)/g; // Captures key-value pairs within an item
                const keyValueRegex = /(?<=^|\s)(\w+):\s*([\s\S]*?)(?=\s\w+:|$)/g;

                let itemEntryMatch;

                while ((itemEntryMatch = itemEntryRegex.exec(value)) !== null) {
                    let itemContent = itemEntryMatch[1];
                    let itemObj = {};

                    let keyValueMatch;
                    while ((keyValueMatch = keyValueRegex.exec(itemContent)) !== null) {
                        let itemKey = keyValueMatch[1].replace(/\n\s*\*/g, '').trim();
                        let itemValue = keyValueMatch[2].replace(/\n\s*\*/g, '\n').trim();
                        itemObj[itemKey] = itemValue;
                    }

                    items.push(itemObj);
                }
                value = items;
            } else if (key.endsWith('s')) {
                value = value.split(',').map(v => v.trim());
            }

            annotationsObj[key] = value;
        }

        // Only search for CSS variables if there are annotations
        if (Object.keys(annotationsObj).length > 0) {
            const cssVarRegExp = /var\(--([\w-]+)\)/g;
            let cssVars = [];

            // Extract all CSS variables from the content
            let varMatch;
            while ((varMatch = cssVarRegExp.exec(content)) !== null) {
                cssVars.push(varMatch[1]);
            }

            // Deduplicate the array of CSS variables
            cssVars = [...new Set(cssVars)];
            annotationsObj['cssVars'] = cssVars;
        }

        // Remove the matched comment from the content
        const newContent = content.replace(commentMatch[0], '').trim();
        return { css: newContent, annotation: annotationsObj };
    }

    return { css: content };
}