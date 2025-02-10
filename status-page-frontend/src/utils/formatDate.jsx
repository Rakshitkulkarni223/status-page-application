const formatDate = (dateString) => {
    const date = new Date(dateString);
  
    const day = date.getDate();
    const suffix = (day % 10 === 1 && day !== 11) ? "st" :
                  (day % 10 === 2 && day !== 12) ? "nd" :
                  (day % 10 === 3 && day !== 13) ? "rd" : "th";
  
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  
    return `${formattedDate.replace(/\d+/, day + suffix)}, ${formattedTime}`;
  };

export {
    formatDate
}