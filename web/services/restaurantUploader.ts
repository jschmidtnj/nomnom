const multipartBoundary = '------MultipartBoundary--';
const htmlContentType = 'Content-Type: text/html';
const htmlStartTag = '<!DOCTYPE html>';

const extractText = (fileText: string): string => {
  if (!fileText.includes(multipartBoundary)) {
    return fileText;
  }

  const parts = fileText.split(multipartBoundary);

  for (const part of parts) {
    if (!part.includes(htmlContentType)) {
      continue;
    }

    const doctypeIndex = part.indexOf(htmlStartTag);
    if (doctypeIndex === -1) {
      continue;
    }

    return part.substring(doctypeIndex).trim();
  }

  return fileText;
}

export const uploadRestaurants = async (fileText: string, accessToken: string): Promise<{ success: boolean, message: string }> => {
  try {
    const extractedText = extractText(fileText);
    console.log("Extracted text for upload:", extractedText);

    const uploadResponse = await fetch('/api/maps_upload', {
      method: 'POST',
      body: JSON.stringify({ data: extractedText }),
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload restaurants: ${uploadResponse.statusText}`);
    }

    return { success: true, message: "Restaurants uploaded successfully." };
  } catch (error) {
    console.error("Error fetching recommended restaurants:", error);

    return {
      success: false,
      message: `Failed to upload restaurants: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};
