#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const [, , developerNameInput, appNameInput] = process.argv;

if (!developerNameInput || !appNameInput) {
	console.error("Usage: node change_name.js <developer_name> <appName>");
	process.exit(1);
}

const developerName = developerNameInput.trim();
const appName = appNameInput.trim();

if (!developerName) {
	console.error("Developer name cannot be empty.");
	process.exit(1);
}

if (!appName) {
	console.error("App name cannot be empty.");
	process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");
const paths = {
	packageJson: path.join(rootDir, "package.json"),
	taoriConf: path.join(rootDir, "src-tauri", "tauri.conf.json"),
	cargoToml: path.join(rootDir, "src-tauri", "Cargo.toml"),
	cargoLock: path.join(rootDir, "src-tauri", "Cargo.lock"),
	mainRs: path.join(rootDir, "src-tauri", "src", "main.rs")
};

const updatedFiles = [];

function ensureFileExists(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Expected file not found: ${path.relative(rootDir, filePath)}`);
	}
}

function writeFile(filePath, content) {
	fs.writeFileSync(filePath, content, "utf8");
	updatedFiles.push(path.relative(rootDir, filePath));
}

function sanitizeIdentifierPart(part, fallback = "app") {
	const cleaned = part.toLowerCase().replace(/[^a-z0-9_-]/g, "");
	return cleaned || fallback;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeTomlString(value) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function updateJsonFile(filePath, updateFn) {
	ensureFileExists(filePath);
	const raw = fs.readFileSync(filePath, "utf8");
	const json = JSON.parse(raw);
	const updated = updateFn(json);
	const serialized = `${JSON.stringify(updated, null, "\t")}\n`;
	writeFile(filePath, serialized);
}

function rewriteCargoToml(rawContent, nextAppName, nextAuthor) {
	const lines = rawContent.split(/\r?\n/);
	let currentSection = null;
	let packageName = null;
	let libName = null;
	let authorReplaced = false;

	const rewritten = lines.map((line) => {
		const trimmed = line.trim();
		const sectionMatch = trimmed.match(/^\[(.+)]$/);
		if (sectionMatch) {
			currentSection = sectionMatch[1].trim().toLowerCase();
			return line;
		}

		if (currentSection === "package" && trimmed.startsWith("name")) {
			if (packageName === null) {
				packageName = trimmed.replace(/name\s*=\s*"(.+?)".*/, "$1");
			}
			return line.replace(/name\s*=\s*"(.+?)"/, `name = "${nextAppName}"`);
		}

		if (currentSection === "package" && trimmed.startsWith("authors")) {
			authorReplaced = true;
			const serializedAuthor = escapeTomlString(nextAuthor);
			return line.replace(/authors\s*=\s*\[.*]/, `authors = ["${serializedAuthor}"]`);
		}

		if (currentSection === "lib" && trimmed.startsWith("name")) {
			if (libName === null) {
				libName = trimmed.replace(/name\s*=\s*"(.+?)".*/, "$1");
			}
			return line.replace(/name\s*=\s*"(.+?)"/, `name = "${nextAppName}_lib"`);
		}

		return line;
	});

	if (!packageName || !libName) {
		throw new Error("Unable to find both package and lib names in Cargo.toml");
	}

	if (!authorReplaced) {
		throw new Error("Unable to update authors field in Cargo.toml");
	}

	const normalized = rewritten.join("\n");
	return { content: normalized.endsWith("\n") ? normalized : `${normalized}\n`, packageName, libName };
}

function updateCargoLock(rawContent, oldName, nextName) {
	const lines = rawContent.split(/\r?\n/);
	let expectNameLine = false;
	let updated = false;

	for (let i = 0; i < lines.length; i += 1) {
		const trimmed = lines[i].trim();
		if (trimmed === "[[package]]") {
			expectNameLine = true;
			continue;
		}

		if (expectNameLine) {
			if (trimmed.startsWith("name = ")) {
				if (!updated && trimmed === `name = "${oldName}"`) {
					lines[i] = lines[i].replace(oldName, nextName);
					updated = true;
				}
				expectNameLine = false;
			} else if (trimmed.length > 0) {
				expectNameLine = false;
			}
		}
	}

	return { content: lines.join("\n"), updated };
}

try {
	updateJsonFile(paths.packageJson, (pkg) => {
		pkg.name = appName;
		return pkg;
	});

	ensureFileExists(paths.cargoToml);
	const cargoResult = rewriteCargoToml(
		fs.readFileSync(paths.cargoToml, "utf8"),
		appName,
		developerName
	);
	writeFile(paths.cargoToml, cargoResult.content);

	ensureFileExists(paths.mainRs);
	const mainRsRaw = fs.readFileSync(paths.mainRs, "utf8");
	const nextLibName = `${appName}_lib`;
	let nextMainContent = mainRsRaw;
	if (cargoResult.libName && mainRsRaw.includes(cargoResult.libName)) {
		const pattern = new RegExp(escapeRegExp(cargoResult.libName), "g");
		nextMainContent = mainRsRaw.replace(pattern, nextLibName);
	}
	if (nextMainContent !== mainRsRaw) {
		writeFile(paths.mainRs, nextMainContent);
	} else if (!mainRsRaw.includes(nextLibName)) {
		throw new Error("main.rs does not reference the expected lib name.");
	}

	updateJsonFile(paths.taoriConf, (conf) => {
		conf.productName = appName;
		const developerSegment = sanitizeIdentifierPart(developerName, "dev");
		conf.identifier = `com.${developerSegment}.${appName}`;
		if (conf.app && Array.isArray(conf.app.windows)) {
			conf.app.windows = conf.app.windows.map((window) => ({
				...window,
				title: appName
			}));
		}
		return conf;
	});

	if (fs.existsSync(paths.cargoLock)) {
		const cargoLockRaw = fs.readFileSync(paths.cargoLock, "utf8");
		const lockResult = updateCargoLock(cargoLockRaw, cargoResult.packageName, appName);
		if (lockResult.updated) {
			writeFile(paths.cargoLock, lockResult.content.endsWith("\n") ? lockResult.content : `${lockResult.content}\n`);
		}
	}

	console.log("Updated:");
	updatedFiles.forEach((file) => console.log(`- ${file}`));
	console.log("Done!");
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
