const fs = require("fs");
const path = require("path");

/**
 * Extracts the file key from a given file path or URL.
 * If using AWS S3, it extracts the object key.
 */
const extractFileKey = (filePath) => {
    if (!filePath) return null;
    
    // Extract key from AWS S3 URL
    if (filePath.includes("amazonaws.com")) {
        const parts = filePath.split("/");
        return parts.slice(3).join("/"); // Assuming bucket name is at index 2
    }

    // Otherwise, return just the filename
    return path.basename(filePath);
};

/**
 * Checks if a file exists in the local system
 */
const fileExists = (filePath) => {
    return fs.existsSync(filePath);
};

/**
 * Reads a file content and returns it as a string
 */
const readFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

/**
 * Saves data to a file
 */
const saveFile = (filePath, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, (err) => {
            if (err) reject(err);
            else resolve("File saved successfully");
        });
    });
};

/**
 * Deletes a file from the local storage
 */
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) reject(err);
            else resolve("File deleted successfully");
        });
    });
};

module.exports = {
    extractFileKey,
    fileExists,
    readFile,
    saveFile,
    deleteFile
};
