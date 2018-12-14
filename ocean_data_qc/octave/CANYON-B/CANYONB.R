CANYONB <- function(date,lat,lon,pres,temp,psal,doxy,param,epres,etemp,epsal,edoxy){
  # function out=CANYONB(date,lat,lon,pres,temp,psal,doxy,param,epres,etemp,epsal,edoxy)
  #
  # CANYON-B calculation according to Bittig et al. (2018):
  # Bayesian neural network mapping of NO3, PO4, SiOH4, AT, CT, pH or pCO2
  # for any set of water column P, T, S, O2, location data as an alternative
  # to (spatial) climatological interpolation. Based on GLODAPv2/GO-SHIP
  # bottle data.
  #
  # Please cite the paper when using CANYON-B.
  # 
  # input:
  # date  - date (UTC) as string ("yyyy-mm-dd HH:MM")
  # lat   - latitude / °N  [-90 90]
  # lon   - longitude / °E [-180 180] or [0 360]
  # pres  - pressure / dbar
  # temp  - in-situ temperature / °C
  # psal  - salinity
  # doxy  - dissolved oxygen / umol kg-1 (!)
  #
  # param - character vector of variable names to be predicted ("AT", "CT", "pH", "pCO2",
  #         "NO3", "PO4", "SiOH4") (optional; defaults to all variables)
  #
  # default values for input errors (optional):
  # epres:   0.5 dbar
  # etemp:   0.005 °C
  # epsal:   0.005 psu
  # edoxy:   1 % of doxy (<- This is a rather optimistic default, meant for
  # GO-SHIP quality bottle data. A reasonable default sensor doxy error would
  # be 3 % of doxy (or higher!).)
  #
  # output:
  # out$(param)     - predicted variable (same size as 'pres' input)
  # out$(param)_ci  - predicted variable uncertainty (same size as 'pres' input)
  # out$(param)_cim - variable measurement uncertainty
  # out$(param)_cin - variable uncertainty for Bayesian neural network mapping
  # out$(param)_cii - variable uncertainty due to input errors
  #
  # measurement errors for AT, CT, pH, NO3, PO4, SiOH4 are 6 umol kg-1, 4
  # umol kg-1, 0.005, 2 %, 2 %, 2 %, respectively (Olsen et al. 2016)
  # measurement error for pCO2 is equivalent to pCO2 calculation
  # uncertainty from CO2SYS(AT,CT). 
  #
  # check values for 
  # 09-Dec-2014 08:45, 17.6° N, -24.3° E, 180 dbar, 16 °C, 36.1 psu, 104 umol O2 kg-1:
  #                (param)  (param)_ci      unit
  #         NO3:   17.91522   1.32494  umol kg-1
  #         PO4:   1.081163   0.073566 umol kg-1
  #         SiOH4: 5.969813   2.485283 umol kg-1
  #         AT:    2359.331   9.020    umol kg-1
  #         CT:    2197.927   9.151    umol kg-1
  #         pH:    7.866380   0.022136 (insitu total scale, comparable to "calculated pH values" as described in Carter et al., 2018)
  #         pCO2:  636.9615  56.5087        uatm
  #
  # examples:
  # out=CANYONB(date="2014-12-09 08:45", lat=17.6, lon=-24.3, pres=180, temp=16, psal=36.1, doxy=104);  # all variables, default input errors
  # out=CANYONB(date="2014-12-09 08:45", lat=17.6, lon=-24.3, pres=180, temp=16, psal=36.1, doxy=104, edoxy=0.03*104);  # all variables, 3 % input error on doxy, otherwise default input errors
  # out=CANYONB(date="2014-12-09 08:45", lat=17.6, lon=-24.3, pres=180, temp=16, psal=36.1, doxy=104, param=c('NO3','PO4','CT'));  # only NO3, PO4 and CT, default input errors
  # out=CANYONB(date=rep("2014-12-09 08:45",2), lat=rep(17.6,2), lon=rep(-24.3,2), pres=rep(180,2), temp=rep(16,2), psal=rep(36.1,2), doxy=rep(104,2));  # more than one single input
  # 
  # references:
  #
  # - CANYON-B method:
  # Bittig et al. (2018). An alternative to static climatologies: Robust
  # estimation of open ocean CO2 variables and nutrient concentrations from
  # T, S and O2 data using Bayesian neural networks. Front. Mar. Sci. 5:328. doi:
  # 10.3389/fmars.2018.00328 
  #
  # pCO2 requires seacarb (available from CRAN):
  # Gattuso et al. (2018). seacarb: Seawater Carbonate Chemistry. R package 
  # version 3.2.7. http://CRAN.R-project.org/package=seacarb
  #
  # Henry Bittig, LOV
  # v0.9, 16.04.2018, pre-release
  # v1.0, 11.09.2018, initial publication
  
  #  The software is provided "as is", without warranty of any kind, 
  #  express or implied, including but not limited to the warranties of
  #  merchantability, fitness for a particular purpose and noninfringement.
  #  In no event shall the authors or copyright holders be liable for any
  #  claim, damages or other liability, whether in an action of contract,
  #  tort or otherwise, arising from, out of or in connection with the
  #  software or the use or other dealings in the software.      
  
  # No input checks! Assumes informed use, e.g., same dimensions for all
  # inputs, ...
  
  inputsdir='' # relative or absolute path to CANYON-B wgts files
  
  
  ## Nothing below here should need to be changed by the user ##
  
  if (missing(date)) {date<-rep("2014-12-09 08:45",2); lat<-17.6*c(1,1); lon<--24.3*c(1,1); pres<-180*c(1,1); temp<-16*c(1,1); psal<-36.1*c(1,1);doxy<-104*c(1,1); } # test values
  if (missing(epres)) epres=.5;
  if (missing(etemp)) etemp=0.005;
  if (missing(epsal)) epsal=0.005;
  if (missing(edoxy)) edoxy=0.01*doxy;
  
  # No input checks! Assumes informed use, e.g., same dimensions for all
  # inputs, ...; only eX can either be scalar or same dimension as inputs
  
  # get number of elements
  nol=length(pres);
  # and expand input errors if needed
  if(length(epres)==1) epres=rep(epres,nol);
  if(length(etemp)==1) etemp=rep(etemp,nol);
  if(length(epsal)==1) epsal=rep(epsal,nol);
  if(length(edoxy)==1) edoxy=rep(edoxy,nol);
  
  # define parameters
  paramnames=c('AT','CT','pH','pCO2','NO3','PO4','SiOH4');
  noparams=length(paramnames);
  inputsigma=c(6,4,.005,NaN,2/100,2/100,2/100);betaipCO2=c(-3.114e-05,1.087e-01,-7.899e+01); # ipCO2 absolute; nuts relative
  inputsigma[3]=sqrt(.005^2 + .01 ^2); # Orr systematic uncertainty
  
  # check which parameters to calculate
  if (missing(param)) {paramflag=rep(TRUE,noparams); # default to all parameters
  } else {paramflag=is.element(paramnames,param); # check for existence of paramnames on desired param output
  } # end

  if (paramflag[4]) require(seacarb) # pCO2 requires seacarb
  
  # input preparation
  lon[which(lon>180)]=lon[which(lon>180)]-360
  #date <- as.POSIXct(date,format="%Y-%m-%d",tz="UTC")
  date=as.POSIXlt(date,tz="UTC") #decimal year from date
  year=format(date,"%Y") # get year
  # and add fractional day
  year=as.numeric(year)+as.double(date-as.POSIXlt(paste0(year,"-01-01 00:00"),format="%Y-%m-%d %H:%M",tz="UTC"))/365
  
  # Latitude: new lat with Polar shift ("Bering Strait prolongation")
  # points for Arctic basin 'West' of Lomonossov ridge (along ca. -037° / 143° E)
  plon=c(-180,-170,-85,-80,-37,-37,143,143,180,180,-180,-180);plat=c(68,66.5,66.5,80,80,90,90,68,68,90,90,68);
  # set location within Arctic basin where Lat is to be modified
  require(mgcv) # inpolygon function 
  arcflag=in.out(cbind(plat,plon),cbind(lat,lon));
  # add distance from -037° / 143° E line; 0.5 at the end is a scaling factor
  lat[arcflag]=lat[arcflag]-sinpi((lon[arcflag]+37)/180)*(90-lat[arcflag])*.5; # stays within range [-90 90]
  rm(plon,plat,arcflag)
  
  # input sequence: incl. year, no doy
  #     decimal year + lat + sinlon + coslon + temperature + salinity + oxygen + pressure --> variable
  data=cbind(year,lat/90,abs(1-((lon-110) %% 360)/180),abs(1-((lon-20) %% 360)/180),temp,psal,doxy,pres/2e4+1/((1+exp(-pres/300))^3));
  no=1; # number of outputs, one at a time
  
  # and cycle all CANYON-B variables
  out=list();
  for (i in (1:noparams)){
    if(paramflag[i]){ # calculate only desired parameters
      # load weights et al. from file
      inwgts=read.table(paste0(inputsdir,"wgts_",paramnames[i],".txt"));
      
      noparsets=ncol(inwgts)-1; # number of networks in committee
      # Input normalization
      if (i>4) { # nuts
        ni=ncol(data)-1; # number of inputs
        ioffset=-1;
        mw=inwgts[1:(ni+1),ncol(inwgts)];
        sw=inwgts[(ni+2):(2*ni+2),ncol(inwgts)];
        data_N=(data[,2:(ni+1)]-t(matrix(mw[1:ni],ni,nol)))/t(matrix(sw[1:ni],ni,nol)); # no year
      } else { # carbonate system
        ni=ncol(data); # number of inputs
        ioffset=0;
        mw=inwgts[1:(ni+1),ncol(inwgts)];
        sw=inwgts[(ni+2):(2*ni+2),ncol(inwgts)];
        data_N=(data-t(matrix(mw[1:ni],ni,nol)))/t(matrix(sw[1:ni],ni,nol));
      } #end
      
      wgts=unlist(inwgts[4,1:noparsets],use.names=FALSE);
      betaciw=inwgts[(2*ni+3):nrow(inwgts),noparsets+1];
      betaciw=betaciw[!is.nan(betaciw)];
      # some preallocations
      cval=matrix(NaN,nol,noparsets);
      cvalcy=matrix(NaN,1,noparsets);
      inval=array(NaN,c(nol,ni,noparsets));
      
      # and cycle all networks of given variable
      for (l in (1:noparsets)) {
        nlayerflag=1+as.numeric(inwgts[2,l]!=0); # check if hidden_layer_2 exists
        nl1=inwgts[1,l];nl2=inwgts[2,l];beta=inwgts[3,l]; # get topo, neurons in first and second layer
        w1=matrix(inwgts[4+(1:(nl1*ni)),l],nl1,ni); # and weights
        b1=inwgts[4+nl1*ni+(1:nl1),l];
        w2=matrix(inwgts[4+nl1*(1+ni)+(1:(nl2*nl1)),l],nl2,nl1);
        b2=inwgts[4+nl1*(1+ni)+nl2*nl1+(1:nl2),l];
        if (nlayerflag==2) {
          w3=matrix(inwgts[4+nl1*(1+ni)+nl2*(nl1+1)+(1:(no*nl2)),l],no,nl2);
          b3=inwgts[4+nl1*(1+ni)+nl2*(nl1+1)+no*nl2+(1:no),l];
        } #end
        
        if (nlayerflag==1) {
          # One hidden layer
          a=     data_N %*%t(w1)+t(b1%*%t(rep(1,nol))); # input layer to first hidden layer
          y=tanh(     a)%*%t(w2)+t(b2%*%t(rep(1,nol))); # first hidden layer to output layer
        } else { if (nlayerflag==2) {
          # Two hidden layers
          a=     data_N %*%t(w1)+t(b1%*%t(rep(1,nol))); # input layer to first hidden layer
          b=tanh(     a)%*%t(w2)+t(b2%*%t(rep(1,nol))); # first hidden layer to second hidden layer
          y=tanh(     b)%*%t(w3)+t(b3%*%t(rep(1,nol))); # second hidden layer to output layer
        }} # end
        
        # and collect outputs
        cval[,l]=y;
        cvalcy[,l]=1/beta; # 'noise' variance
        
        # add input effects 
        x1=aperm(array(w1,c(nl1,ni,nol)),c(3,1,2))*array((1-tanh(a)^2),c(nol,nl1,ni)); 
        if (nlayerflag==1) {
          inx=matrix(NaN,nol,ni);
          # dumb for loop
          for (k in (1:nol)) { inx[k,]=w2*x1[k,,]; } # end
        } else if (nlayerflag==2) {
          x2=aperm(array(w2,c(nl2,nl1,nol)),c(3,1,2))*array((1-tanh(b)^2),c(nol,nl2,nl1));
          # dumb for loop
          inx=matrix(NaN,nol,ni);
          for (k in (1:nol)) { inx[k,]=w3%*%x2[k,,]%*%x1[k,,]; } # end
        } # end
        # and collect outputs
        inval[,,l]=inx;
        rm(inx,x1,x2,k,nl1,nl2,b1,w1,b2,w2,b3,w3,beta,a,b,y,nlayerflag)
      } #end % for noparsets
      
      # Denormalization of the network output 
      cval=cval*sw[ni+1]+mw[ni+1]; # variable
      cvalcy=cvalcy*sw[ni+1]^2;  #'noise' variance
      
      
      # add committee of all params as evidence-weighted mean 
      V1=sum(wgts);V2=sum(wgts^2);
      out[[paramnames[i]]]=rowSums(t(matrix(wgts,noparsets,nol))*cval)/V1; # weighted mean
      
      cvalcu=rowSums(t(matrix(wgts,noparsets,nol))*(cval-matrix(out[[paramnames[i]]],nol,noparsets))^2)/(V1-V2/V1); # CU variance
      #out.(paramnames{i})=reshape(out.(paramnames{i}),size(pres));
      # weigh noise and weight uncertainty variance
      cvalcib=rep(sum(wgts*cvalcy)/V1,nol);
      # wu parameterized from cu for speed
      cvalciw=(betaciw[2]+betaciw[1]*sqrt(cvalcu))^2;
      # weigh input effects
      inx=rowSums(aperm(array(wgts,c(noparsets,nol,ni)),c(2,3,1))*inval,dims=2)/V1; # weighted mean
      # and rescale for normalization inside the MLP (both inputs and outputs)
      inx=t(matrix(sw[ni+1]/sw[1:ni],ni,nol))*inx;
      # additional pressure scaling
      ddp=1/2e4+1/((1+exp(-pres/300))^4)*exp(-pres/300)/100;
      inx[,8+ioffset]=inx[,8+ioffset]*ddp;
      cvalcin=rowSums(inx[,(5:8)+ioffset]^2*cbind(etemp,epsal,edoxy,epres)^2); # input variance
      rm(inx,inval,ddp)
      # reference / measurement uncertainty
      if (i>4) {
        cvalcimeas=(inputsigma[i]*out[[paramnames[i]]])^2; # relative reference uncertainty; variance
      } else { if (i==4) { # indirect pCO2 reference uncertainty
        #cvalcimeas=polyval(betaipCO2,out.[[paramnames[i]]])^2; # variance
        cvalcimeas=(betaipCO2[1]*out[[paramnames[i]]]^2+betaipCO2[2]*out[[paramnames[i]]]+betaipCO2[3])^2; # variance
      } else {
        cvalcimeas=inputsigma[i]^2; # variance
      }} # end
      
      # variable uncertainty
      out[[paste0(paramnames[i],'_ci')]]=sqrt(
        cvalcimeas+      # reference / measurement data uncertainty
        cvalcib+cvalciw+ # individual network noise + weight uncertainty
        cvalcu+cvalcin   # committee uncertainty + transferred input uncertainty
        ); # sqrt(sum variance)
      # and individual terms
      out[[paste0(paramnames[i],'_cim')]]=sqrt(cvalcimeas); # sqrt(variance)
      #out.([paramnames{i} '_cib'])=sqrt(cvalcib(1)); % sqrt(variance)
      out[[paste0(paramnames[i],'_cin')]]=sqrt(cvalcib+cvalciw+cvalcu); # sqrt(variance)
      out[[paste0(paramnames[i],'_cii')]]=sqrt(cvalcin); # sqrt(variance)
      
      rm(V1,V2,wgts,cval,cvalcib,cvalcimeas,cvalcin,cvalciw,cvalcu,cvalcy,l,noparsets,data_N,mw,sw,ni,ioffset,inwgts,betaciw)
      
      if (i==4) { # recalculate pCO2
        #outcalc=CO2SYS(2300,out.(paramnames{i})(:),1,2,35,25,NaN,0,NaN,0,0,1,10,1); % ipCO2 = 'DIC' / umol kg-1 -> pCO2 / uatm
        outcalc=carb(flag=15,var1=0.0023, var2=out[[paramnames[i]]]*1e-6, S=35, T=25, P=0, Patm=1, Pt=0, Sit=0, pHscale="T", kf="pf", k1k2="l", ks="d", b="u74", gas="standard") # ipCO2 = 'DIC' / umol kg-1 -> pCO2 / uatm
        #outderiv=derivnum('par2',2300,out.(paramnames{i})(:),1,2,35,25,NaN,0,NaN,0,0,1,10,1); % eipCO2 = e'DIC' / umol kg-1 -> epCO2 / uatm
        outderiv=derivnum('var2',flag=15,var1=0.0023, var2=out[[paramnames[i]]]*1e-6, S=35, T=25, P=0, Patm=1, Pt=0, Sit=0, pHscale="T", kf="pf", k1k2="l", ks="d", b="u74", gas="standard")
        out[[paramnames[i]]]=outcalc$pCO2;
        out[[paste0(paramnames[i],'_ci')]] =outderiv$pCO2*1e-6*out[[paste0(paramnames[i],'_ci')]] ; # epCO2 = dpCO2/dDIC * e'DIC'
        out[[paste0(paramnames[i],'_cim')]]=outderiv$pCO2*1e-6*out[[paste0(paramnames[i],'_cim')]]; # epCO2 = dpCO2/dDIC * e'DIC'
        out[[paste0(paramnames[i],'_cin')]]=outderiv$pCO2*1e-6*out[[paste0(paramnames[i],'_cin')]]; # epCO2 = dpCO2/dDIC * e'DIC'
        out[[paste0(paramnames[i],'_cii')]]=outderiv$pCO2*1e-6*out[[paste0(paramnames[i],'_cii')]]; # epCO2 = dpCO2/dDIC * e'DIC'
      } # end
        
    } #end % if paramflag
  } #end % for noparams
  
  return(out)
} # end of function
