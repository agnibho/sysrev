var bibgraph={};
var idx=0;
var doi="https://doi.org/";
var urlParams=new URLSearchParams(window.location.search);
if(urlParams.has("doi")){
  doi="https://"+urlParams.get("doi")+"/";
}
if(localStorage.getItem("bibliographies")){
  bibgraph=JSON.parse(localStorage.getItem("bibliographies"));
}
function write(){
  localStorage.setItem("bibliographies", JSON.stringify(bibgraph));
}
function abstractFormat(text){
  console.log(text);
  text="\n"+text;
  text=text.replace(/\nobjectives?/i, "<strong>Objectives</strong>");
  text=text.replace(/\nbackground/i, "<strong>Background</strong>");
  text=text.replace(/\nmethods?/i, "\n<strong>Methods</strong>");
  text=text.replace(/\ndesigns?/i, "\n<strong>Design</strong>");
  text=text.replace(/\nmaterials? and methods?/i, "\n<strong>Materials and methods</strong>");
  text=text.replace(/\nmethodology/i, "\n<strong>Methodology</strong>");
  text=text.replace(/\ninterventions?/i, "\n<strong>Interventions</strong>");
  text=text.replace(/\nstatistical analysis/i, "\n<strong>Statistical Analysis</strong>");
  text=text.replace(/\nprincipal findings?/i, "\n<strong>Principal Findings</strong>");
  text=text.replace(/\nfindings?/i, "\n<strong>Findings</strong>");
  text=text.replace(/\noutcomes?/i, "\n<strong>Outcomes</strong>");
  text=text.replace(/\nresults?/i, "\n<strong>Results</strong>");
  text=text.replace(/\nconclusions?/i, "\n<strong>Conclusions</strong>");
  text=text.replace(/\nsignificance/i, "\n<strong>Significance</strong>");
  console.log(text);
  return text;
}
function showAllBibs(){
  $("#all-bibs").html("");
  Object.values(bibgraph).forEach(function(bib){
    idx=bib.config.id;
    $("#all-bibs").html($("#all-bibs").html()+"<li class='list-group-item'><a href='#' data-id='"+bib.config.id+"' class='select-bib' >"+bib.config.label+"</a> ["+bib.config.id+"] <button  data-id='"+bib.config.id+"' class='btn btn-sm btn-outline-secondary delete-bib'>Delete</button></li>");
  });
  $("#all-bibs").on("click", ".select-bib", function(e){
    e.preventDefault();
    $("#loader").addClass("d-none");
    $("#step-1-div").removeClass("d-none");
    idx=$(this).data("id");
    $("#step-1").html("");
    bibgraph[idx].items.forEach(function(item,i){
      bibgraph[idx].items[i].selected=[false,false,false];
      $("#step-1").html($("#step-1").html()+"<a href='#' class='list-group-item to-select' data-step='0' data-cite='"+item.citationKey+"'><input type='checkbox' class='step-1-select'> "+item.title+" ["+item.creators[0].lastName+" et al]</a>");
    });
  });
  $("#all-bibs").on("click", ".delete-bib", function(e){
    e.preventDefault();
    delete bibgraph[$(this).data("id")];
    write();
    showAllBibs();
  });
}
$(document).ready(function(){
  $(".step-selector").on("click", ".to-select", function(e){
    e.preventDefault();
    $(this).children("input").prop("checked", !$(this).children("input").prop("checked"));
    bibgraph[idx].items.find(i=>i.citationKey==$(this).data("cite")).selected[$(this).data("step")]=$(this).children("input").prop("checked");
    write();
  });
  if(urlParams.has("src")){
    if(urlParams.has("file")){
      file="&file="+urlParams.get("file");
    }
    else{
      file="";
    }
    $.getJSON(urlParams.get("src")+"?callback=?"+file, function(data){
      bibgraph[data.config.id]=data;
      write();
      showAllBibs();
    });
  }
  $("#load-file").click(function(e){
    e.preventDefault();
    file=document.getElementById("file-selector").files[0];
    fr=new FileReader();
    fr.onload=fileLoaded;
    fr.readAsText(file);
    function fileLoaded(){
      try{
        result=JSON.parse(fr.result);
        bibgraph[result.config.id]=result;
      }
      catch(e){
        alert("Failed to parse data. \n"+e);
      }
      write();
      showAllBibs();
    }
  });
  $("#step-1to2").click(function(e){
    e.preventDefault();
    $("#step-1-div").addClass("d-none");
    $("#step-2-div").removeClass("d-none");
    $("#step-2").html("");
    bibgraph[idx].items.forEach(function(item, idx){
      flag="";
      if(item.selected[1]==true) flag="checked";
      if(item.selected[0]){
        $("#step-2").html($("#step-2").html()+"<div class='list-group-item'><a href='#' class='to-select' data-step='1' data-cite='"+item.citationKey+"'><input type='checkbox' "+flag+" class='step-2-select'> "+item.title+" ["+item.creators[0].lastName+" et al]</a><div class='abstract'>"+abstractFormat(item.abstractNote)+"</div></div>");
      }
    });
  });
  $("#step-2to3").click(function(e){
    e.preventDefault();
    $("#step-2-div").addClass("d-none");
    $("#step-3-div").removeClass("d-none");
    $("#step-3").html("");
    bibgraph[idx].items.forEach(function(item, idx){
      flag="";
      if(item.selected[2]==true) flag="checked";
      if(item.selected[1]){
        if(item.url){
          url="<br>Link: <a href='"+item.url+"' target='_blank'>"+item.url+"</a>";
        }
        else{
          url="";
        }
        $("#step-3").html($("#step-3").html()+"<div class='list-group-item'><a href='#' class='to-select' data-step='2' data-cite='"+item.citationKey+"'><input type='checkbox' "+flag+" class='step-3-select'> "+item.title+" ["+item.creators[0].lastName+" et al]</a><div class='alert alert-info text-right'>Paper available at DOI: <a href='"+doi+item.DOI+"' target='_blank'>"+item.DOI+"</a>"+url+"</div></div>");
      }
    });
  });
  $("#finish").click(function(e){
    e.preventDefault();
    $("#step-3-div").addClass("d-none");
    $("#download-div").removeClass("d-none");
    finalBib=$.extend(true, {}, bibgraph[idx]);
    for(i=(finalBib.items.length-1); i>=0; i--){
      if(!(finalBib.items[i].selected[0] && finalBib.items[i].selected[1] && finalBib.items[i].selected[2])){
        finalBib.items.splice(i,1);
      }
    }
    $("#finished").html("");
    finalBib.items.forEach(function(item){
      if(item.selected[2]){
        $("#finished").html($("#finished").html()+"<li class='list-group-item'>"+item.title+" ["+item.creators[0].lastName+" et al]</li>");
        delete item.selected;
      }
    });
    data="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(finalBib, null, 2));
    $("#download").prop("href", data);
    $("#download").prop("download", finalBib.config.label+".json");
  });
  $("#step-back").click(function(e){
    e.preventDefault();
    $("#step-1-div").addClass("d-none");
    $("#loader").removeClass("d-none");
  });
  $("#step-2to1").click(function(e){
    e.preventDefault();
    $("#step-2-div").addClass("d-none");
    $("#step-1-div").removeClass("d-none");
  });
  $("#step-3to2").click(function(e){
    e.preventDefault();
    $("#step-3-div").addClass("d-none");
    $("#step-2-div").removeClass("d-none");
  });
  $("#step-backto3").click(function(e){
    e.preventDefault();
    $("#download-div").addClass("d-none");
    $("#step-3-div").removeClass("d-none");
  });
});
