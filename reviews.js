(function(){
  var API_KEY = window.STAGO_GOOGLE_API_KEY || '';
  var PLACE_ID = window.STAGO_PLACE_ID || '';
  var container = document.getElementById('google-reviews');
  if (!container || !API_KEY || !PLACE_ID) return;

  function timeAgo(isoDate) {
    var diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 86400) return 'dzisiaj';
    var days = Math.floor(diff / 86400);
    if (days < 7) return days + (days === 1 ? ' dzien' : ' dni') + ' temu';
    var weeks = Math.floor(days / 7);
    if (weeks < 5) return weeks + ' tyg. temu';
    var months = Math.floor(days / 30);
    if (months < 12) return months + ' mies. temu';
    return Math.floor(days / 365) + ' r. temu';
  }

  function renderReviews(reviews, rating, count) {
    var sorted = reviews.slice().sort(function(a, b) {
      return new Date(b.publishTime) - new Date(a.publishTime);
    });
    var top3 = sorted.slice(0, 3);

    container.textContent = '';
    top3.forEach(function(r) {
      var card = document.createElement('div');
      card.className = 'review-card reveal visible';

      var stars = document.createElement('div');
      stars.className = 'review-stars';
      var s = '';
      for (var i = 0; i < 5; i++) s += i < r.rating ? '\u2733' : '\u2606';
      stars.textContent = s;

      var reviewText = (r.originalText && r.originalText.text) || (r.text && r.text.text) || '';
      var text = document.createElement('p');
      text.className = 'review-text';
      text.textContent = '\u201E' + reviewText + '\u201D';

      var author = document.createElement('div');
      author.className = 'review-author';
      var strong = document.createElement('strong');
      strong.textContent = r.authorAttribution ? r.authorAttribution.displayName : '';
      var span = document.createElement('span');
      span.textContent = timeAgo(r.publishTime);
      author.appendChild(strong);
      author.appendChild(span);

      card.appendChild(stars);
      card.appendChild(text);
      card.appendChild(author);
      container.appendChild(card);
    });

    // Aktualizuj naglowek
    if (rating && count) {
      var h2 = document.querySelector('#opinie .h2');
      if (h2 && h2.firstChild) h2.firstChild.textContent = rating.toFixed(1) + ' na Google. ';
      var countEl = document.querySelector('#opinie .review-count');
      if (countEl) countEl.textContent = count + ' opinii';
    }
  }

  var url = 'https://places.googleapis.com/v1/places/' + PLACE_ID +
    '?fields=reviews,rating,userRatingCount&languageCode=pl&key=' + encodeURIComponent(API_KEY);

  fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.reviews && data.reviews.length) {
        renderReviews(data.reviews, data.rating, data.userRatingCount);
      }
    })
    .catch(function() { /* fallback zostaje */ });
})();
