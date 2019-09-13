// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	const autoPairCharacters = {
		"'": "'",
		"{": "}",
		"(": ")",

	}
	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
	}

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "live-auto-type" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let registerCode1Command = vscode.commands.registerCommand('extension.liveAutoType.registerCode1FromClipBoard', function () {
		vscode.env.clipboard.readText().then((text) => {
			context.workspaceState.update('liveAutoType.command1', text)
		});
	});

	let printCode1Command = vscode.commands.registerCommand('extension.liveAutoType.printCode1', function () {
		let textToPrint = context.workspaceState.get('liveAutoType.command1')
		let autoPairHistory = []
		let cumulativeDelay = 0
		let secondPass = false

		for (let i = 0; i < textToPrint.length; i++) {
			cumulativeDelay += getRandomInt(10, 200)
			setTimeout(() => printNextChar(i), cumulativeDelay)
		}
		function printNextChar(charIndex) {
			let charToPrint = textToPrint.charAt(charIndex)
			let moveCursorForward = false
			let addCharacterPair = false

			if (charToPrint === "'" && secondPass) {
				let foo = 'foo'
			}
			if (charToPrint === "'") {
				secondPass = true
			}
			if (autoPairHistory[autoPairHistory.length - 1] === charToPrint) {
				let position = vscode.window.activeTextEditor.selection.active;
				let newPosition = position.with(position.line, position.character + 1)
				vscode.window.activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
				autoPairHistory.pop()
				moveCursorForward = true
				return
			}

			if (autoPairCharacters.hasOwnProperty(charToPrint))
				addCharacterPair = true

			vscode.window.activeTextEditor.edit(editBuilder => {
				let position = vscode.window.activeTextEditor.selection.active;
				if (charToPrint !== '\n')
					editBuilder.insert(position, textToPrint.charAt(charIndex));
			}).then(() => {
				if (addCharacterPair) {
					autoPairHistory.push(autoPairCharacters[charToPrint])
					vscode.window.activeTextEditor.edit(editBuilder => {
						let position = vscode.window.activeTextEditor.selection.active;
						editBuilder.insert(position, autoPairCharacters[charToPrint]);
						addCharacterPair = false
					}).then(() => {
						let position = vscode.window.activeTextEditor.selection.active;
						let newPosition = position.with(position.line, position.character - 1);
						vscode.window.activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
					})
				}
			}).then(() => {
				if (moveCursorForward) {
					let position = vscode.window.activeTextEditor.selection.active;
					let newPosition = position.with(position.line, position.character + 2);
					vscode.window.activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
					moveCursorForward = false;
				}
			})

		}
	});

	context.subscriptions.push(registerCode1Command);
	context.subscriptions.push(printCode1Command);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
