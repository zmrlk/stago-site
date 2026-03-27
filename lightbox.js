(function(){
  var imgs=document.querySelectorAll('.product-gallery-item img');
  if(!imgs.length)return;
  var allSrcs=[].map.call(imgs,function(i){return i.src});
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

  var show=function(i){idx=i;limg.src=allSrcs[idx]};
  var open=function(i){show(i);box.classList.add('active');document.body.style.overflow='hidden'};
  var close=function(){box.classList.remove('active');document.body.style.overflow=''};

  imgs.forEach(function(img,i){img.addEventListener('click',function(){open(i)})});
  closeBtn.addEventListener('click',close);
  prevBtn.addEventListener('click',function(e){e.stopPropagation();show((idx-1+allSrcs.length)%allSrcs.length)});
  nextBtn.addEventListener('click',function(e){e.stopPropagation();show((idx+1)%allSrcs.length)});
  box.addEventListener('click',function(e){if(e.target===box)close()});
  document.addEventListener('keydown',function(e){if(!box.classList.contains('active'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show((idx-1+allSrcs.length)%allSrcs.length);if(e.key==='ArrowRight')show((idx+1)%allSrcs.length)});
})();
