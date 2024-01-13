const axios = require("axios");
const { JSDOM } = require("jsdom");

const getPatentData = async (patentNumber) => {
  try {
    const url = `FILL_IN_URL_HERE`;
    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    /**
     * Extracts the location information from a text node.
     * It looks for text within parentheses and determines whether it's a US location based on the case of the last two characters.
     *
     * @param {object} locationNode - The text node that contains location information.
     * @returns {string} The extracted location. If the location is in the US, only the state abbreviation is returned.
     * If it's a non-US location, the entire text within the parentheses is returned.
     */
    const extractLocation = (locationNode) => {
      // Trim the content of the text node to remove any leading or trailing whitespace
      const locationText = locationNode.textContent.trim();
      // Regular expression to match content within parentheses
      const regex = /\(([^)]+)\)/;
      // Apply the regex to the location text to find matches
      const matches = locationText.match(regex);
      // If there is a match and the matched group is not empty
      if (matches && matches[1]) {
        // Get the last two characters of the matched group (potential US state abbreviation)
        const postalAbbreviation = matches[1].slice(-2);
        // If the postal abbreviation is in uppercase, it's likely a US state abbreviation
        if (postalAbbreviation === postalAbbreviation.toUpperCase()) {
          // Return the US state abbreviation
          return postalAbbreviation;
        }
        // If it's not a US state abbreviation, return the entire matched group
        return matches[1];
      }

      // If there is no match or the matched group is empty, return an empty string
      return "";
    };

    /**
     * Extracts locations from the text content following header tags within the HTML document.
     * It prioritizes US locations based on postal abbreviations and falls back to the first found location otherwise.
     */
    const extractLocations = (headerTextSingular, headerTextPlural) => {
      // Select all <strong> elements as they are typically used for headers
      const headers = Array.from(document.querySelectorAll("strong"));

      // Iterate through each <strong> element to find our target headers
      for (let header of headers) {
        // Check if the current header's text includes either the singular or plural form
        if (
          header.textContent.includes(headerTextSingular) ||
          header.textContent.includes(headerTextPlural)
        ) {
          let usLocation = ""; // To store the US location if found
          let firstLocation = ""; // To store the first found location as a fallback
          let anchor = header.nextElementSibling; // Start looking at the element right after the header

          // Iterate over sibling elements starting from the header's next sibling
          while (anchor && anchor.tagName === "A") {
            // Access the text node immediately following the anchor tag
            let locationNode = anchor.nextSibling;
            if (locationNode && locationNode.nodeType === 3) {
              // Node type 3 is a text node
              const location = extractLocation(locationNode); // Extract the location from the text node
              if (location) {
                // Save the first location as a fallback option
                if (!firstLocation) firstLocation = location;

                // If this is a US location based on length and case (assumed to be a state abbreviation),
                // store it and stop the loop because we prioritize US locations
                if (
                  location.length === 2 &&
                  location === location.toUpperCase()
                ) {
                  usLocation = location;
                  break; // Found a US location, no need to continue
                }
              }
            }
            // Move to the next sibling element to continue the search
            anchor = locationNode.nextSibling;
          }
          // Return the US location if found, otherwise return the first location found
          return usLocation || firstLocation;
        }
      }
      // If no location is found, return an empty string
      return "";
    };

    // Extract the location for assignee and inventors, apply rules
    const assigneeLocation = extractLocations("Assignee", "Assignees");
    const inventorsLocation = extractLocations("Inventor", "Inventors");

    // Determine the location to use based on the rules
    const location = assigneeLocation || inventorsLocation;

    return {
      patentNumber,
      location,
    };
  } catch (error) {
    console.error(`Error fetching data for patent ${patentNumber}: `, error);
    return null;
  }
};
// Function to process all patent numbers and log results in order
const processPatentsInOrder = async (patentNumbers) => {
  try {
    // Map each patent number to a promise returned by getPatentData
    const patentDataPromises = patentNumbers.map((number) =>
      getPatentData(number)
    );

    // Wait for all promises to resolve
    const allPatentData = await Promise.all(patentDataPromises);

    console.log("Locations:");
    allPatentData.forEach((data) => {
      // Determine if the location is foreign
      const isForeign =
        data.location &&
        data.location.length === 2 &&
        data.location === data.location.toUpperCase()
          ? "No"
          : "Yes";
      const locationOutput = data.location
        ? data.location
        : "No Location Found";
      console.log(`${isForeign}\t${locationOutput}`);
    });
  } catch (error) {
    console.error("An error occurred while processing the patents:", error);
  }
};

const patentNumbers = [
  // Fill in patent numbers here
];
processPatentsInOrder(patentNumbers);
