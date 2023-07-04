import { basename, dirname } from 'path';
import { FileType, Uri, window, workspace } from 'vscode';

function getCopyName(original: string): [string, number] {
	const lastIndex = original.lastIndexOf('.');
	let name = original.slice(0, lastIndex);
	let ext = original.slice(lastIndex + 1);

	if (lastIndex !== 0) {
		name += '-copy'
	}
	else {
		ext += '-copy'
	}

	let newName;
	let newLength;

	if (lastIndex === -1) {
		newName = name;
		newLength = newName.length;
	}
	else if (lastIndex === 0) {
		newName = '.' + ext;
		newLength = newName.length;
	} else {
		newName = name + '.' + ext;
		newLength = name.length;
	}

	return [
		newName,
		newLength
	]
}

export default async function duplicate(uri: Uri) {
    const { fsPath } = uri
    const file = basename(fsPath)
    const [copyName, copyNameLength] = getCopyName(file)

    const input = await window.showInputBox({
        title: 'Enter a name for the duplicated file',
        value: copyName,
        valueSelection: [0, copyNameLength]
    })

    if (input === undefined) {
        return
    }

    const directory = Uri.file(dirname(fsPath))
    const oldFile = Uri.file(fsPath)
    const oldStats = await workspace.fs.stat(oldFile)
    const newFile = Uri.joinPath(directory, input)

    try {
        const newStats = await workspace.fs.stat(newFile)
        if (oldStats.type !== newStats.type) {
            window.showErrorMessage('Can\'t change resource type!')
            return
        }

        switch (newStats.type) {
            case FileType.File:
                const answer = await window.showQuickPick(['Yes', 'No'], {
                    title: 'A file with this name does already exist. Overwrite?',
                    canPickMany: false,
                    ignoreFocusOut: true,
                })

                if (answer !== 'Yes') {
                    return
                }
                break;
            default:
                window.showErrorMessage('Refusing to overwrite existing ' + FileType[newStats.type])
                return
        }
    } catch (error) { }

    try {
        await workspace.fs.copy(oldFile, newFile, {
            overwrite: true
        })
    } catch (error) {
        console.error(error)
    }
}