#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const [, , rawCommand] = process.argv;
const command = rawCommand ? rawCommand.toLowerCase() : null;

if (!command) {
	console.error("Usage: node version.cjs <patch|minor|major|pop|peek>");
	process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");
const paths = {
	packageJson: path.join(rootDir, "package.json"),
	taoriConf: path.join(rootDir, "src-tauri", "tauri.conf.json"),
	cargoToml: path.join(rootDir, "src-tauri", "Cargo.toml"),
	versions: path.join(rootDir, "constants", ".versions")
};

const updatedFiles = [];

function ensureFile(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Missing file: ${path.relative(rootDir, filePath)}`);
	}
}

function readJson(filePath) {
	ensureFile(filePath);
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, "\t")}\n`, "utf8");
	updatedFiles.push(path.relative(rootDir, filePath));
}

function updatePackageJson(version) {
	const pkg = readJson(paths.packageJson);
	pkg.version = version;
	writeJson(paths.packageJson, pkg);
}

function updateTauriConf(version) {
	const conf = readJson(paths.taoriConf);
	conf.version = version;
	writeJson(paths.taoriConf, conf);
}

function rewriteCargoTomlVersion(rawContent, version) {
	const lines = rawContent.split(/\r?\n/);
	let currentSection = null;
	let versionSet = false;

	const rewritten = lines.map((line) => {
		const trimmed = line.trim();
		const sectionMatch = trimmed.match(/^\[(.+)]$/);
		if (sectionMatch) {
			currentSection = sectionMatch[1].trim().toLowerCase();
			return line;
		}

		if (currentSection === "package" && trimmed.startsWith("version")) {
			versionSet = true;
			return line.replace(/version\s*=\s*"(.+?)"/, `version = "${version}"`);
		}

		return line;
	});

	if (!versionSet) {
		throw new Error("Unable to locate package version in Cargo.toml");
	}

	const normalized = rewritten.join("\n");
	return normalized.endsWith("\n") ? normalized : `${normalized}\n`;
}

function updateCargoToml(version) {
	ensureFile(paths.cargoToml);
	const raw = fs.readFileSync(paths.cargoToml, "utf8");
	const nextContent = rewriteCargoTomlVersion(raw, version);
	fs.writeFileSync(paths.cargoToml, nextContent, "utf8");
	updatedFiles.push(path.relative(rootDir, paths.cargoToml));
}

function parseVersion(version) {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) {
		throw new Error(`Invalid version format: ${version}`);
	}
	return match.slice(1).map((value) => parseInt(value, 10));
}

function formatVersion(parts) {
	return parts.join(".");
}

function bumpVersion(type, currentVersion) {
	const parts = parseVersion(currentVersion);
	if (type === "patch") {
		parts[2] += 1;
	} else if (type === "minor") {
		parts[1] += 1;
		parts[2] = 0;
	} else if (type === "major") {
		parts[0] += 1;
		parts[1] = 0;
		parts[2] = 0;
	} else {
		throw new Error(`Unknown bump type: ${type}`);
	}
	return formatVersion(parts);
}

function readVersionHistory() {
	ensureFile(paths.versions);
	const content = fs.readFileSync(paths.versions, "utf8");
	const versions = content
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	if (versions.length === 0) {
		throw new Error("Version history is empty. Expected at least one entry.");
	}
	return versions;
}

function writeVersionHistory(versions) {
	const serialized = `${versions.join("\n")}\n`;
	fs.writeFileSync(paths.versions, serialized, "utf8");
}

function applyVersion(version) {
	updatePackageJson(version);
	updateTauriConf(version);
	updateCargoToml(version);
}

function handlePeek(history) {
	const current = history[history.length - 1];
	console.log(current);
}

function handlePop(history) {
	if (history.length <= 1) {
		console.warn("Cannot pop version: only one entry exists in constants/.versions");
		process.exit(1);
	}
	const previousVersion = history[history.length - 2];
	applyVersion(previousVersion);
	writeVersionHistory(history.slice(0, -1));
	console.log(`Reverted to version ${previousVersion}`);
}

function handleBump(history, type) {
	const current = history[history.length - 1];
	const nextVersion = bumpVersion(type, current);
	applyVersion(nextVersion);
	writeVersionHistory([...history, nextVersion]);
	console.log(`Updated version to ${nextVersion}`);
}

try {
	const history = readVersionHistory();

	switch (command) {
		case "patch":
		case "minor":
		case "major":
			handleBump(history, command);
			break;
		case "pop":
			handlePop(history);
			break;
		case "peek":
			handlePeek(history);
			break;
		default:
			throw new Error(`Unknown command: ${command}`);
	}

	if (updatedFiles.length) {
		console.log("Updated files:");
		updatedFiles.forEach((file) => console.log(`- ${file}`));
	}
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
