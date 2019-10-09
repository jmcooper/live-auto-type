const fs = require('fs');

const vscode = require('vscode');

function activate(context) {
	context.workspaceState.update('liveAutoType.codeblocks', []);
	context.workspaceState.update('liveAutoType.codeblockIndex', 0);

	const autoPairCharacters = {
		"'": "'",
		'"': '"',
		'`': '`',
		"{": "}",
		"(": ")",
		"[": "]",
	};

	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	let appendCodeFromClipBoardCommand = vscode.commands.registerCommand('extension.liveAutoType.appendCodeFromClipBoard', function () {
		vscode.env.clipboard.readText().then((text) => {
			let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];
			codeblocks.push(text);
			context.workspaceState.update('liveAutoType.codeblocks', codeblocks);
			logOutputToFileIfNecessary();
		});
	});

	let printNextCodeBlockCommand = vscode.commands.registerCommand('extension.liveAutoType.printNextCodeBlock', function () {
		let autoPairHistory = [];
		let cumulativeDelay = 0;
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0
		let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];
		let nextTextToPrint = codeblocks[codeblockIndex];

		if (!nextTextToPrint)
			return
			
		context.workspaceState.update('liveAutoType.codeblocks', codeblocks);
		context.workspaceState.update('liveAutoType.codeblockIndex', codeblockIndex + 1);
		logOutputToFileIfNecessary();

		for (let i = 0; i < nextTextToPrint.length; i++) {
			let randomDelay = getRandomInt(50, 200);
			if (randomDelay > 210) randomDelay += 500;

			cumulativeDelay += randomDelay;
			setTimeout(() => printNextChar(i), cumulativeDelay);
		}
		function printNextChar(charIndex) {
			let charToPrint = nextTextToPrint.charAt(charIndex);

			if (autoPairHistory[autoPairHistory.length - 1] === charToPrint) {
				let position = vscode.window.activeTextEditor.selection.active;
				let newPosition = position.with(position.line, position.character + 1);
				vscode.window.activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
				autoPairHistory.pop();
				return
			}

			vscode.window.activeTextEditor.edit(editBuilder => {
				let position = vscode.window.activeTextEditor.selection.active;
				if (charToPrint !== '\n')
					editBuilder.insert(position, nextTextToPrint.charAt(charIndex));
			}).then(() => {
				let position = vscode.window.activeTextEditor.selection.active;
				if (autoPairCharacters.hasOwnProperty(charToPrint)) {
					autoPairHistory.push(autoPairCharacters[charToPrint]);
					
					vscode.window.activeTextEditor.edit(editBuilder => {
						editBuilder.insert(position, autoPairCharacters[charToPrint]);
						addCharacterPair = false;
					}).then(() => {
						let position = vscode.window.activeTextEditor.selection.active;
						let newPosition = position.with(position.line, position.character - 1);
						vscode.window.activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
					})
				}
				vscode.window.activeTextEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.Default);
			})
		}
	});

	function getRemainingCodeblocks() {
		let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0;

		if (codeblocks.length === 0)
			return 'There are no queued code blocks.\n';

		let output = '';
		let cnt = 0;
		for (let i = codeblockIndex; i < codeblocks.length; i++) {
			let delimiter =  cnt === 0 ? 
				'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' :
				'-----------------------------------------------------------';
			output += '\n' + delimiter + '\n' + codeblocks[i] + '\n' + delimiter + '\n';
			cnt++;
		}
		return output;
	}

	function logOutputToFileIfNecessary(outputToLog) {
		try {
			let logFilePath = context.workspaceState.get('liveAutoType.logFilePath');
			if (!logFilePath) 
				return

			let output = outputToLog ? outputToLog : getRemainingCodeblocks();

			if (logFilePath) {
				fs.writeFileSync(logFilePath, output);
			}
		} catch(err) {
			console.error(err);
		}
	}

	let logRemainingCodeblocksCommand = vscode.commands.registerCommand('extension.liveAutoType.logRemainingCodeblocks', function () {
		let outputChannel = vscode.window.createOutputChannel("Remaining Codeblocks")
		outputChannel.clear();
		let output = getRemainingCodeblocks();
		outputChannel.append(output);
		outputChannel.show();
		logOutputToFileIfNecessary(output);
	});

	let logEntireCodeblocksHistoryCommand = vscode.commands.registerCommand('extension.liveAutoType.logEntireCodeblocksHistory', function () {
		let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0;

		let outputChannel = vscode.window.createOutputChannel("Entire Codeblocks History");
		outputChannel.clear();

		if (codeblocks.length === 0) {
			outputChannel.appendLine('There are no queued code blocks.');
			return outputChannel.show();
		}

		codeblocks.forEach((codeblock, i) => {
			let delimiter =  i === codeblockIndex ? 
				'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' :
				'-----------------------------------------------------------';
			
			outputChannel.appendLine('');
			outputChannel.appendLine(delimiter);
			outputChannel.appendLine(codeblock);
			outputChannel.appendLine(delimiter);
			outputChannel.appendLine('');
		});
		outputChannel.show();
	});

	let copyLogFilePathFromClipboardCommand = vscode.commands.registerCommand('extension.liveAutoType.copyLogFilePathFromClipboardCommand', function ()  {
		vscode.env.clipboard.readText().then((text) => {
			context.workspaceState.update('liveAutoType.logFilePath', text);
		});
		logOutputToFileIfNecessary();
	});

	let moveBackOneCodeblockCommand = vscode.commands.registerCommand('extension.liveAutoType.moveBackOneCodeblock', function () {
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0
		if (codeblockIndex === 0) return
		context.workspaceState.update('liveAutoType.codeblockIndex', codeblockIndex - 1);
		logOutputToFileIfNecessary();
	});

	let skipToNextCodeblockCommand = vscode.commands.registerCommand('extension.liveAutoType.skipToNextCodeblock', function () {
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0
		let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];

		if (codeblockIndex === codeblocks.length-1) return

		context.workspaceState.update('liveAutoType.codeblockIndex', codeblockIndex + 1);
		logOutputToFileIfNecessary();
	});

	context.subscriptions.push(appendCodeFromClipBoardCommand);
	context.subscriptions.push(printNextCodeBlockCommand);
	context.subscriptions.push(logRemainingCodeblocksCommand);
	context.subscriptions.push(logEntireCodeblocksHistoryCommand);
	context.subscriptions.push(moveBackOneCodeblockCommand);
	context.subscriptions.push(skipToNextCodeblockCommand);
	context.subscriptions.push(copyLogFilePathFromClipboardCommand);

}
exports.activate = activate;

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
