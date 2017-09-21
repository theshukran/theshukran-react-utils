const vscode = require('vscode');

const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const { dirname } = require('path');


const noop = () => { }

const createPackage = (folder) => {
    const package = `{\n\t"name" : "@${lastPathComponent(folder)}"\n}`;
    fs.writeFile(folder, package, noop);
}

const lastPathComponent = (path) => {
    const parts = path.split('/');
    return parts.pop() || parts.pop();
}

const generateImport = (text, selection) => {
    const regex = /import(?:[\W])*?\{([^}]*?)\}(?:[\W])*?from.*'react-native'/gm;
    return text.match(regex).join('\n')
}


const normalizeComponentName = (string) => {
    return {
        componentName: _.upperFirst(_.camelCase(_.startCase(string))),
        fileName: _.kebabCase(string)
    }
}


const createFile = (componentName, fileName, contents, original, callback) => {
    const rootPath = vscode.workspace.rootPath;
    const folderPath = settings.componentsFolderPath;
    const filePath = `${rootPath}${folderPath}${fileName}/index.js`;
    const packagePath = `${rootPath}${folderPath}package.json`;

    if (fs.existsSync(filePath)) return callback('File exists');

    fs.readFile(`${settings.extensionPath}/assets/template.js`, 'utf-8', (err, template) => {
        const imports = generateImport(original, contents);
        const data = _.mapKeys({ componentName, contents, imports }, (value, key) => key.toUpperCase());
        const componentContents = _.template(template, { interpolate: /__([\s\S]+?)__/g })(data);

        mkdirp(dirname(filePath), err => {
            if (err) return callback(err);

            if (!fs.existsSync(packagePath))
                createPackage(packagePath);

            fs.writeFile(filePath, componentContents, callback);
        });
    });
};


const editorContext = (callback) => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const selection = editor.selection;
        const original = editor.document.getText();
        const text = editor.document.getText(selection);

        return callback(editor, selection, original, text);
    }
};


const settings = {
    extensionPath: vscode.extensions.getExtension('theShukran.theshukran-react-utils').extensionPath,
    componentsFolderPath: vscode.workspace.getConfiguration('theshukran-react-utils').path,
    componentsFolderLastPath: lastPathComponent(vscode.workspace.getConfiguration('theshukran-react-utils').path)
};


exports.settings = settings;
exports.normalizeComponentName = normalizeComponentName;

exports.createFile = createFile;
exports.editorContext = editorContext;
