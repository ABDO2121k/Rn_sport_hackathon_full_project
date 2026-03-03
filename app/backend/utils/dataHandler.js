const fs = require('fs');
const path = require('path');

/**
 * Read data from a JSON file
 * @param {string} fileName - Name of the file (e.g., 'players.json')
 * @returns {Object} Parsed JSON data
 */
function readData(fileName) {
    try {
        const filePath = path.join(__dirname, '..', 'data', fileName);
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${fileName}:`, error.message);
        throw new Error(`Failed to read ${fileName}`);
    }
}

/**
 * Write data to a JSON file
 * @param {string} fileName - Name of the file (e.g., 'players.json')
 * @param {Object} data - Data to write
 * @returns {boolean} Success status
 */
function writeData(fileName, data) {
    try {
        const filePath = path.join(__dirname, '..', 'data', fileName);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error writing ${fileName}:`, error.message);
        throw new Error(`Failed to write ${fileName}`);
    }
}

/**
 * Insert a new item into an array in a JSON file
 * @param {string} fileName - Name of the file (e.g., 'scouts.json')
 * @param {string} arrayKey - Key of the array in the JSON (e.g., 'searches')
 * @param {Object} item - Item to insert
 * @returns {Object} The inserted item with generated ID
 */
function insertItem(fileName, arrayKey, item) {
    try {
        const data = readData(fileName);

        if (!data[arrayKey]) {
            data[arrayKey] = [];
        }

        // Generate new ID
        const newId = data[arrayKey].length > 0
            ? Math.max(...data[arrayKey].map(i => i.id)) + 1
            : 1;

        const newItem = {
            id: newId,
            createdAt: new Date().toISOString(),
            ...item
        };

        data[arrayKey].push(newItem);
        writeData(fileName, data);

        return newItem;
    } catch (error) {
        console.error(`Error inserting item into ${fileName}:`, error.message);
        throw new Error(`Failed to insert item into ${fileName}`);
    }
}

/**
 * Update an item in an array in a JSON file
 * @param {string} fileName - Name of the file
 * @param {string} arrayKey - Key of the array in the JSON
 * @param {number} itemId - ID of the item to update
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated item or null if not found
 */
function updateItem(fileName, arrayKey, itemId, updates) {
    try {
        const data = readData(fileName);

        if (!data[arrayKey]) {
            return null;
        }

        const itemIndex = data[arrayKey].findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return null;
        }

        data[arrayKey][itemIndex] = {
            ...data[arrayKey][itemIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        writeData(fileName, data);
        return data[arrayKey][itemIndex];
    } catch (error) {
        console.error(`Error updating item in ${fileName}:`, error.message);
        throw new Error(`Failed to update item in ${fileName}`);
    }
}

/**
 * Delete an item from an array in a JSON file
 * @param {string} fileName - Name of the file
 * @param {string} arrayKey - Key of the array in the JSON
 * @param {number} itemId - ID of the item to delete
 * @returns {boolean} Success status
 */
function deleteItem(fileName, arrayKey, itemId) {
    try {
        const data = readData(fileName);

        if (!data[arrayKey]) {
            return false;
        }

        const itemIndex = data[arrayKey].findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return false;
        }

        data[arrayKey].splice(itemIndex, 1);
        writeData(fileName, data);

        return true;
    } catch (error) {
        console.error(`Error deleting item from ${fileName}:`, error.message);
        throw new Error(`Failed to delete item from ${fileName}`);
    }
}

/**
 * Find items matching criteria
 * @param {string} fileName - Name of the file
 * @param {string} arrayKey - Key of the array in the JSON
 * @param {Function} predicate - Filter function
 * @returns {Array} Matching items
 */
function findItems(fileName, arrayKey, predicate) {
    try {
        const data = readData(fileName);

        if (!data[arrayKey]) {
            return [];
        }

        return data[arrayKey].filter(predicate);
    } catch (error) {
        console.error(`Error finding items in ${fileName}:`, error.message);
        throw new Error(`Failed to find items in ${fileName}`);
    }
}

module.exports = {
    readData,
    writeData,
    insertItem,
    updateItem,
    deleteItem,
    findItems
};
