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
		});
	});

	let printNextCodeBlockCommand = vscode.commands.registerCommand('extension.liveAutoType.printNextCodeBlock', function () {
		let autoPairHistory = [];
		let cumulativeDelay = 0;
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0
		let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];
		let nextTextToPrint = codeblocks[codeblockIndex];

		context.workspaceState.update('liveAutoType.codeblocks', codeblocks);
		context.workspaceState.update('liveAutoType.codeblockIndex', codeblockIndex + 1);

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
				if (autoPairCharacters.hasOwnProperty(charToPrint)) {
					autoPairHistory.push(autoPairCharacters[charToPrint]);
					
					vscode.window.activeTextEditor.edit(editBuilder => {
						let position = vscode.window.activeTextEditor.selection.active;
						editBuilder.insert(position, autoPairCharacters[charToPrint]);
						addCharacterPair = false;
					}).then(() => {
						let position = vscode.window.activeTextEditor.selection.active;
						let newPosition = position.with(position.line, position.character - 1);
						vscode.window.activeTextEditor.selection = new vscode.Selection(newPosition, newPosition);
					})
				}
			})
		}
	});

	let logRemainingCodeblocksCommand = vscode.commands.registerCommand('extension.liveAutoType.logRemainingCodeblocks', function () {
		let codeblocks = context.workspaceState.get('liveAutoType.codeblocks') || [];
		let codeblockIndex = context.workspaceState.get('liveAutoType.codeblockIndex') || 0

		if (codeblocks.length === 0)
			return console.log('There are no queued code blocks.')
		
		let outputChannel = vscode.window.createOutputChannel("Remaining Codeblocks")
		outputChannel.clear();
		for (let i = codeblockIndex; i < codeblocks.length; i++) {
			let delimiter =  i === 0 ? 
				'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' :
				'-----------------------------------------------------------';

			outputChannel.appendLine('');
			outputChannel.appendLine(delimiter)
			outputChannel.appendLine(codeblocks[i]);
			outputChannel.appendLine(delimiter)
			outputChannel.appendLine('');
		}
		outputChannel.show();
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
		try {

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
	} catch(err) {
		console.log(err)
	}
	});

	context.subscriptions.push(appendCodeFromClipBoardCommand);
	context.subscriptions.push(printNextCodeBlockCommand);
	context.subscriptions.push(logRemainingCodeblocksCommand);
	context.subscriptions.push(logEntireCodeblocksHistoryCommand);
}
exports.activate = activate;

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
