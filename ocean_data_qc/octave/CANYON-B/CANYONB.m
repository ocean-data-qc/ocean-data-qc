function out=CANYONB(year_,lat,lon,pres,temp,psal,doxy,param,epres,etemp,epsal,edoxy)
% function out=CANYONB(gtime,lat,lon,pres,temp,psal,doxy,param,epres,etemp,epsal,edoxy)
%
% CANYON-B calculation according to Bittig et al. (2018):
% Bayesian neural network mapping of NO3, PO4, SiOH4, AT, CT, pH or pCO2
% for any set of water column P, T, S, O2, location data as an alternative
% to (spatial) climatological interpolation. Based on GLODAPv2/GO-SHIP
% bottle data.
%
% Please cite the paper when using CANYON-B.
%
% input:
% gtime - date (UTC) as matlab time (fractional days; 01-Jan-0000 00:00:00 = 1)
% lat   - latitude / �N  [-90 90]
% lon   - longitude / �E [-180 180] or [0 360]
% pres  - pressure / dbar
% temp  - in-situ temperature / �C
% psal  - salinity
% doxy  - dissolved oxygen / umol kg-1 (!)
% e(var)- input error for pres, temp, psal, doxy
%
% default values for input errors:
% epres:   0.5 dbar
% etemp:   0.005 �C
% epsal:   0.005 psu
% edoxy:   1 % of doxy (<- This is a rather optimistic default, meant for
% GO-SHIP quality bottle data. A reasonable default sensor doxy error would
% be 3 % of doxy (or higher!).)
%
% output:
% out.(param)     - predicted variable (same size as 'pres' input)
% out.(param)_ci  - predicted variable uncertainty (same size as 'pres' input)
% out.(param)_cim - variable measurement uncertainty
% out.(param)_cin - variable uncertainty for Bayesian neural network mapping
% out.(param)_cii - variable uncertainty due to input errors
%
% measurement errors for AT, CT, pH, NO3, PO4, SiOH4 are 6 umol kg-1, 4
% umol kg-1, 0.005, 2 %, 2 %, 2 %, respectively (Olsen et al. 2016)
% measurement error for pCO2 is equivalent to pCO2 calculation
% uncertainty from CO2SYS(AT,CT).
%
% check values for
% 09-Dec-2014 08:45, 17.6� N, -24.3� E, 180 dbar, 16 �C, 36.1 psu, 104 umol O2 kg-1:
%                (param)  (param)_ci      unit
%         NO3:   17.91522   1.32494  umol kg-1
%         PO4:   1.081163   0.073566 umol kg-1
%         SiOH4: 5.969813   2.485283 umol kg-1
%         AT:    2359.331   9.020    umol kg-1
%         CT:    2197.927   9.151    umol kg-1
%         pH:    7.866380   0.022136 (insitu total scale, comparable to "calculated pH values" as described in Carter et al., 2018)
%         pCO2:  637.0937  56.5193        uatm
%
% examples:
% out=CANYONB(datenum([2014 12 09 08 45 00]),17.6,-24.3,180,16,36.1,104);  % all variables, default input errors
% out=CANYONB(datenum([2014 12 09 08 45 00]),17.6,-24.3,180,16,36.1,104,[],[],[],[],0.03*104); % all variables, 3 % input error on doxy, otherwise default input errors
% out=CANYONB(datenum([2014 12 09 08 45 00]),17.6,-24.3,180,16,36.1,104,{'NO3','PO4','CT'});   % only NO3, PO4 and CT, default input errors
% out=CANYONB(datenum([2014 12 09 08 45 00]),17.6,-24.3,180,16,36.1,104,['NO3';'PO4';'CT ']);  % only NO3, PO4 and CT, default input errors
% out=CANYONB(datenum([2014 12 09 08 45 00])*[1 1],17.6*[1 1],-24.3*[1 1],180*[1 1],16*[1 1],36.1*[1 1],104*[1 1]); % more than one single input
%
% references:
%
% - CANYON-B method:
% Bittig et al. (2018). An alternative to static climatologies: Robust
% estimation of open ocean CO2 variables and nutrient concentrations from
% T, S and O2 data using Bayesian neural networks. Front. Mar. Sci. 5:328. doi:
% 10.3389/fmars.2018.00328
%
% pCO2 requires CO2SYS-matlab:
% van Heuven et al. (2011). MATLAB Program Developed for CO2 System
% Calculations. ORNL/CDIAC-105b. Carbon Dioxide Information Analysis
% Center, Oak Ridge National Laboratory, US Department of Energy,  Oak
% Ridge, Tennessee. http://dx.doi.org/10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1
%
% pCO2 uncertainty requires CO2SYS-matlab v2 extensions derivnum and errors:
% Orr et al. (2018). Routine uncertainty propagation for the marine carbon
% dioxide system. Mar. Chem. subm.
% https://github.com/jamesorr/CO2SYS-MATLAB
%
% Henry Bittig, LOV
% v0.9, 16.04.2018, pre-release
% v1.0, 11.09.2018, initial publication

%  The software is provided "as is", without warranty of any kind,
%  express or implied, including but not limited to the warranties of
%  merchantability, fitness for a particular purpose and noninfringement.
%  In no event shall the authors or copyright holders be liable for any
%  claim, damages or other liability, whether in an action of contract,
%  tort or otherwise, arising from, out of or in connection with the
%  software or the use or other dealings in the software.

% No input checks! Assumes informed use, e.g., same dimensions for all
% inputs, ...

inputsdir=[fileparts(mfilename('fullpath')),filesep]; % relative or absolute path to CANYON-B wgts files

CALCULATE_UNCERTAINTIES=false;

%% Nothing below here should need to be changed by the user %%

if nargin<1, year_=2014*[1;1];lat=17.6*[1;1];lon=-24.3*[1;1];pres=180*[1;1];temp=16*[1;1];psal=36.1*[1;1];doxy=104*[1;1]; end % test values
if nargin< 9 || isempty(epres), epres=.5; end
if nargin<10 || isempty(etemp), etemp=0.005; end
if nargin<11 || isempty(epsal), epsal=0.005; end
if nargin<12 || isempty(edoxy), edoxy=0.01*doxy(:); end

% No input checks! Assumes informed use, e.g., same dimensions for all
% inputs, ...; only eX can either be scalar or same dimension as inputs

% get number of elements
nol=numel(pres);
% and expand input errors if needed
if length(epres)==1, epres=repmat(epres,nol,1); end
if length(etemp)==1, etemp=repmat(etemp,nol,1); end
if length(epsal)==1, epsal=repmat(epsal,nol,1); end
if length(edoxy)==1, edoxy=repmat(edoxy,nol,1); end

% define parameters
paramnames={'AT';'CT';'pH';'pCO2';'NO3';'PO4';'SiOH4'};
noparams=size(paramnames,1);
inputsigma=[6;4;.005;NaN;2/100;2/100;2/100];betaipCO2=[-3.114e-05;1.087e-01;-7.899e+01]; % ipCO2 absolute; nuts relative
inputsigma(3)=sqrt(.005^2 + .01 ^2); % Orr systematic uncertainty

% check which parameters to calculate
paramflag=false(noparams,1);
if nargin<8 || isempty(param), param=paramnames; end % default to all parameters
if ischar(param),param=cellstr(param); end % make sure param is cellstr
calculate_phts25p0=false;
if ismember('pHTS25P0',param)
    co2sys_param={'AT','pH','SiOH4','PO4'};
    misses=setdiff(co2sys_param,param);
    param=union(param,misses);
    calculate_phts25p0=true;
end

for i=1:noparams % check for existence of paramnames on desired param output
    paramflag(i)=any(strcmpi(cellstr(param),paramnames{i}));
end
%disp(['Calculate CANYON-B ' strjoin(paramnames(paramflag),', ')])

% input preparation
lon(lon>180)=lon(lon>180)-360;
% Latitude: new lat with Polar shift ("Bering Strait prolongation")
% points for Arctic basin 'West' of Lomonossov ridge (along ca. -037� / 143� E)
plon=[-180 -170 -85 -80 -37 -37 143 143 180 180 -180 -180];plat=[68 66.5 66.5 80 80 90 90 68 68 90 90 68];
% set location within Arctic basin where Lat is to be modified;
[arcflag,arcedgeflag]=inpolygon(lon,lat,plon,plat);
arcflag=arcflag & ~arcedgeflag; % exclude edges
% add distance from -037� / 143� E line; 0.5 at the end is a scaling factor
lat(arcflag)=lat(arcflag)-sind(lon(arcflag)+37).*(90-lat(arcflag))*.5; % stays within range [-90 90]
clear plon plat arcflag arceedgeflag gvec

% input sequence: incl. year, no doy
%     decimal year + lat + sinlon + coslon + temperature + salinity + oxygen + pressure --> variable
data=[year_(:) lat(:)/90 abs(1-mod(lon(:)-110,360)/180) abs(1-mod(lon(:)-20,360)/180) temp(:) psal(:) doxy(:) pres(:)./2e4+1./((1+exp(-pres(:)./300)).^3)];
no=1; % number of outputs, one at a time

% and cycle all CANYON-B variables
for i=1:noparams
    if paramflag(i) % calculate only desired parameters
        % load weights et al. from file
        inwgts=dlmread([inputsdir 'wgts_' paramnames{i} '.txt']);
        noparsets=size(inwgts,2)-1; % number of networks in committee
        % Input normalization
        if i>4 % nuts
            ni=size(data(:,2:end),2); % number of inputs
            ioffset=-1;
            mw=inwgts(1:ni+1,end);
            sw=inwgts(ni+2:2*ni+2,end);
            data_N=(data(:,2:end)-(mw(1:ni)*ones(1,nol))')./(sw(1:ni)*ones(1,nol))'; % no year
        else % carbonate system
            ni=size(data,2); % number of inputs
            ioffset=0;
            mw=inwgts(1:ni+1,end);
            sw=inwgts(ni+2:2*ni+2,end);
            data_N=(data-(mw(1:ni)*ones(1,nol))')./(sw(1:ni)*ones(1,nol))';
        end
        wgts=inwgts(4,1:noparsets)';
        betaciw=inwgts(2*ni+3:end,noparsets+1)';betaciw(isnan(betaciw))=[];
        % some preallocations
        cval=ones(nol,noparsets)*NaN;
        cvalcy=ones(1,noparsets)*NaN;
        inval=ones(nol,ni,noparsets)*NaN;
        
        % and cycle all networks of given variable
        for l=1:noparsets
            
            nlayerflag=1+logical(inwgts(2,l)); % check if hidden_layer_2 exists
            nl1=inwgts(1,l);nl2=inwgts(2,l);beta=inwgts(3,l); % get topo, neurons in first and second layer
            w1=reshape(inwgts(4+(1:nl1*ni),l),nl1,ni); % and weights
            b1=inwgts(4+nl1*ni+(1:nl1),l);
            w2=reshape(inwgts(4+nl1*(1+ni)+(1:nl2*nl1),l),nl2,nl1);
            b2=inwgts(4+nl1*(1+ni)+nl2*nl1+(1:nl2),l);
            if nlayerflag==1
            elseif nlayerflag==2
                w3=reshape(inwgts(4+nl1*(1+ni)+nl2*(nl1+1)+(1:no*nl2),l),no,nl2);
                b3=inwgts(4+nl1*(1+ni)+nl2*(nl1+1)+no*nl2+(1:no),l);
            end
            
            if nlayerflag==1
                % One hidden layer
                a=     data_N *w1'+repmat(b1',nol,1); % input layer to first hidden layer
                y=tanh(     a)*w2'+repmat(b2',nol,1); % first hidden layer to output layer
            elseif nlayerflag==2
                % Two hidden layers
                a=     data_N *w1'+repmat(b1',nol,1); % input layer to first hidden layer
                b=tanh(     a)*w2'+repmat(b2',nol,1); % first hidden layer to second hidden layer
                y=tanh(     b)*w3'+repmat(b3',nol,1); % second hidden layer to output layer
            end
            
            % and collect outputs
            cval(:,l)=y;
            cvalcy(:,l)=1./beta; % 'noise' variance
            
            if(CALCULATE_UNCERTAINTIES)
                % add input effects
                x1=permute(repmat(w1,[1 1 nol]),[3 1 2]).*repmat(1-tanh(a).^2,[1 1 ni]);
                if nlayerflag==1
                    inx=zeros(nol,ni)*NaN;
                    % dumb for loop
                    for k=1:nol, inx(k,:)=w2*squeeze(x1(k,:,:)); end
                elseif nlayerflag==2
                    x2=permute(repmat(w2,[1 1 nol]),[3 1 2]).*repmat(1-tanh(b).^2,[1 1 nl1]);
                    % dumb for loop
                    inx=zeros(nol,ni)*NaN;
                    for k=1:nol, inx(k,:)=w3*squeeze(x2(k,:,:))*squeeze(x1(k,:,:)); end
                end
                % and collect outputs
                inval(:,:,l)=inx;
                clear inx x1 x2 k nl1 nl2 b1 w1 b2 w2 b3 w3 beta a b y nlayerflag
            end
        end % for noparsets
        
        
        % Denormalization of the network output
        cval=cval*sw(ni+1)+mw(ni+1); % variable
        cvalcy=cvalcy*sw(ni+1).^2; % 'noise' variance
        
        
        % add committee of all params as evidence-weighted mean
        V1=sum(wgts);V2=sum(wgts.^2);
        out.(paramnames{i})=sum(repmat(wgts',nol,1).*cval,2)./V1; % weighted mean
        cvalcu=sum(repmat(wgts',nol,1).*(cval-repmat(out.(paramnames{i}),1,noparsets)).^2,2)./(V1-V2/V1); % CU variance
        out.(paramnames{i})=reshape(out.(paramnames{i}),size(pres));
        if CALCULATE_UNCERTAINTIES
            % weigh noise and weight uncertainty variance
            cvalcib=repmat(sum(wgts'.*cvalcy,2)./V1,nol,1);
            % wu parameterized from cu for speed
            cvalciw=polyval(betaciw,sqrt(cvalcu)).^2;
            % weigh input effects
            inx=sum(permute(repmat(wgts,[1,nol,ni]),[2 3 1]).*inval,3)./V1; % weighted mean
            % and rescale for normalization inside the MLP (both inputs and outputs)
            inx=repmat(sw(ni+1)./sw(1:ni)',[nol,1]).*inx;
            % additional pressure scaling
            ddp=1./2e4+1./((1+exp(-pres./300)).^4).*exp(-pres./300)./100;
            inx(:,8+ioffset)=inx(:,8+ioffset).*ddp(:);
            cvalcin=sum(inx(:,(5:8)+ioffset).^2.*[etemp(:) epsal(:) edoxy(:) epres(:)].^2,2); % input variance
            clear inx inval ddp
            % reference / measurement uncertainty
            if i>4
                cvalcimeas=(inputsigma(i).*out.(paramnames{i})(:)).^2; % relative reference uncertainty; variance
            elseif i==4 % indirect pCO2 reference uncertainty
                cvalcimeas=polyval(betaipCO2,out.(paramnames{i})(:)).^2; % variance
            else
                cvalcimeas=inputsigma(i).^2; % variance
            end
            
            % variable uncertainty
            out.([paramnames{i} '_ci'])=reshape(sqrt(...
                cvalcimeas+ ... % reference / measurement data uncertainty
                cvalcib+cvalciw+... % individual network noise + weight uncertainty
                cvalcu+cvalcin),... % committee uncertainty + transferred input uncertainty
                size(pres)); % sqrt(sum variance)
            % and individual terms
            out.([paramnames{i} '_cim'])=sqrt(cvalcimeas); % sqrt(variance)
            %out.([paramnames{i} '_cib'])=sqrt(cvalcib(1)); % sqrt(variance)
            out.([paramnames{i} '_cin'])=reshape(sqrt(cvalcib+cvalciw+cvalcu),size(pres)); % sqrt(variance)
            out.([paramnames{i} '_cii'])=reshape(sqrt(cvalcin),size(pres)); % sqrt(variance)
            
            clear V1 V2 wgts cval cvalci* cvalcu cvalcy l noparsets data_N mw sw ni ioffset inwgts betaciw
        end
        if i==4 % recalculate pCO2
            outcalc=CO2SYS(2300,out.(paramnames{i})(:),1,2,35,25,NaN,0,NaN,0,0,1,10,1); % ipCO2 = 'DIC' / umol kg-1 -> pCO2 / uatm         
            out.(paramnames{i})=reshape(outcalc(:,4),size(pres));
            if CALCULATE_UNCERTAINTIES
                outderiv=derivnum('par2',2300,out.(paramnames{i})(:),1,2,35,25,NaN,0,NaN,0,0,1,10,1); % eipCO2 = e'DIC' / umol kg-1 -> epCO2 / uatm
                out.([paramnames{i} '_ci'])=reshape(outderiv(:,2).*out.([paramnames{i} '_ci'])(:),size(pres)); % epCO2 = dpCO2/dDIC * e'DIC'
                out.([paramnames{i} '_cim'])=reshape(outderiv(:,2).*out.([paramnames{i} '_cim'])(:),size(pres)); % epCO2 = dpCO2/dDIC * e'DIC'
                out.([paramnames{i} '_cin'])=reshape(outderiv(:,2).*out.([paramnames{i} '_cin'])(:),size(pres)); % epCO2 = dpCO2/dDIC * e'DIC'
                out.([paramnames{i} '_cii'])=reshape(outderiv(:,2).*out.([paramnames{i} '_cii'])(:),size(pres)); % epCO2 = dpCO2/dDIC * e'DIC'
            end
        end
    end % if paramflag
end % for noparams   
if calculate_phts25p0
    outcalc=CO2SYS(out.AT,out.pH,1,3,psal,temp,25,pres,0,out.SiOH4,out.PO4,1,10,1);
    out.pHTS25P0=outcalc(:,37);
end