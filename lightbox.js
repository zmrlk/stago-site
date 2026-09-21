(function(){
  var switches=document.querySelectorAll('.gallery-switch a');
  var panels=document.querySelectorAll('.realizacje-panel');
  if(switches.length&&panels.length){
    var selectGallery=function(id){
      if(![].some.call(panels,function(p){return p.id===id}))id=panels[0].id;
      panels.forEach(function(p){p.hidden=p.id!==id});
      switches.forEach(function(a){
        if(a.hash==='#'+id)a.setAttribute('aria-current','true');
        else a.removeAttribute('aria-current');
      });
    };
    switches.forEach(function(a){
      var panel=document.getElementById(a.hash.slice(1));
      if(!panel)return;
      a.querySelector('.gallery-count').textContent=panel.querySelectorAll('.realizacja-card').length;
      a.addEventListener('click',function(e){
        e.preventDefault();history.replaceState(null,'',a.hash);selectGallery(panel.id);
      });
    });
    selectGallery(location.hash.slice(1));
    window.addEventListener('hashchange',function(){selectGallery(location.hash.slice(1))});
  }
  var imgs=document.querySelectorAll('.product-gallery-item img, .realizacja-card img');
  if(!imgs.length)return;
  // W siatce wisi lekki wariant zdjecia — po powiekszeniu pokazujemy pelny plik z data-full.
  var visibleImgs=[].slice.call(imgs);
  var idx=0;

  var box=document.createElement('div');
  box.className='lightbox';

  var closeBtn=document.createElement('button');
  closeBtn.className='lightbox-close';
  closeBtn.setAttribute('aria-label','Zamknij');
  closeBtn.textContent='\u00D7';

  var prevBtn=document.createElement('button');
  prevBtn.className='lightbox-nav lightbox-prev';
  prevBtn.setAttribute('aria-label','Poprzednie');
  prevBtn.textContent='\u2039';

  var nextBtn=document.createElement('button');
  nextBtn.className='lightbox-nav lightbox-next';
  nextBtn.setAttribute('aria-label','Nastepne');
  nextBtn.textContent='\u203A';

  var limg=document.createElement('img');
  limg.alt='Realizacja STAGO';
  limg.width=1000;
  limg.height=750;

  box.appendChild(closeBtn);
  box.appendChild(prevBtn);
  box.appendChild(limg);
  box.appendChild(nextBtn);
  document.body.appendChild(box);

  var show=function(i){idx=i;var img=visibleImgs[idx];limg.src=img.getAttribute('data-full')||img.src;limg.alt=img.alt};
  var open=function(img){visibleImgs=[].filter.call(imgs,function(i){return !i.closest('[hidden]')});show(visibleImgs.indexOf(img));box.classList.add('active');document.body.style.overflow='hidden'};
  var close=function(){box.classList.remove('active');document.body.style.overflow=''};

  imgs.forEach(function(img){img.addEventListener('click',function(){open(img)})});
  closeBtn.addEventListener('click',close);
  prevBtn.addEventListener('click',function(e){e.stopPropagation();show((idx-1+visibleImgs.length)%visibleImgs.length)});
  nextBtn.addEventListener('click',function(e){e.stopPropagation();show((idx+1)%visibleImgs.length)});
  box.addEventListener('click',function(e){if(e.target===box)close()});
  document.addEventListener('keydown',function(e){if(!box.classList.contains('active'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show((idx-1+visibleImgs.length)%visibleImgs.length);if(e.key==='ArrowRight')show((idx+1)%visibleImgs.length)});
})();
