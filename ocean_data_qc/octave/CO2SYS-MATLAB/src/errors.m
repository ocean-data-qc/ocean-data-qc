% errors()
% This subroutine propagates uncertainties for the marine carbonate chemistry calculations
% from errors (or uncertainties) on six input 
%  - pair of carbonate system variables 
%  - nutrients (silicate and phosphate concentrations)
%  - temperature and salinity
% plus errors in dissociation constants pK0, pK1, pK2, pKb, pKw, pKspa, and pKspc as well as total boron
%
% It calls derivnum, which computes numerical derivatives, and then
% it applies error propagation using the method of moments.
% The latter is a general technique to estimate the 2nd moment of a variable z
% (variance or standard deviation) based on a 1st-order approximation to z.
%
%**************************************************************************
%
%  **** SYNTAX:
%  [err, headers, units] = errors(PAR1,PAR2,PAR1TYPE,PAR2TYPE,..  .
%                                     SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
%                                     ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,...
%                                     pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS)
% 
%  **** SYNTAX EXAMPLES:
%  [Result]                = errors(2400,2200,1,2,35,10,10,0,0,15,1,2,2,0.01,0.01,0,0,0,0,0,1,4,1)
%  [Result,Headers]        = errors(2400,   8,1,3,35,25,5,0,3000,15,1,2,0.001,0,0,0,0,0,0,0,1,4,1)
%  [Result,Headers,Units]  = errors(500,    8,5,3,35,25,5,0,4000,15,1,2,0.001,0,0,0,0,'','',0,1,4,1)
%  [A]                     = errors(2400,2000:10:2400,1,2,35,10,10,0,0,15,2,2,0,0,0,0,'','',0,1,1,4,1)
%  [A]                     = errors(2400,2200,1,2,0:1:35,0,25,4200,0,15,1,2,2,0,0,0,0,'','',0,1,4,1)
%  epK = [0.002, 0.0075, 0.015, 0.01, 0.01, 0.02, 0.02];
%  eBt = 0.02;
%  [A, hdr, units]   = errors(2400,2200,1,2,35,0,25,0:100:4200,0,15,1,2,2,0,0,0,0,epK,eBt,0,1,4,1)
%  
%**************************************************************************
%
% INPUT:
%
%   - ePAR1, ePAR2   :  uncertainty of PAR1 and PAR2 of input pair of CO2 system variables (same units as PAR1 & PAR2)
%   - eS, eT         :  uncertainty of Salinity and Temperature (same units as S and T)
%   - ePO4, eSI      :  uncertainty of Phosphate and Silicate total concentrations (same units as PO4 and SI [umol/kg])
%   - epK            :  uncertainty of all seven dissociation constants (a vector) [pK units]
%   - eBt            :  uncertainty of total boron, given as fractional relative error (eBt=0.02 is a 2% error)
%   - r              :  correlation coefficient between PAR1 AND PAR2 (typicaly 0)
%   - others         :  same as input for subroutine  CO2SYS() : scalar or vectors
%
% All parameters may be scalars or vectors except epK and eBt.
%   * epK must be vector of 7 values : errors of [pK0, pK1, pK2, pKb, pKw, pKspa, pKspc]. 
%     These errors are assumed to be the same for all rows of data.
%     These 7 values are in pK units
%
%     if epK is empty (= ''), this routine specifies default values.
%     These default standard errors are :
%        pK0   :  0.002 
%        pK1   :  0.0075
%        pK2   :  0.015
%        pKb   :  0.01    boric acid
%        pKw   :  0.01    water dissociation
%        pKspa :  0.02    solubility product of Aragonite 
%        pKspc :  0.02    solubility product of Calcite
%
%   * eBt is a scalar real number, fractional relative error (between 0.00 and 1.00)
%     for TB, where the default is eBt=0.02. It is assumed to be the same
%     for all rows of data.
%
% In constrast, ePAR1, ePAR2, eS, eT, ePO4 and eSI, 
%   - if vectors, are errors associated with each data point
%   - if scalars, are one error value associated to all data points
% The same for parameter "r".
%
% If 'r' is nonzero with a value between -1.0 and 1.0, it indicates the correlation 
% between uncertainties of the input pair of carbonate system variables.
% By default, 'r' is zero. However, for some pairs the user may want to specify a
% different value. For example, measurements of pCO2 and pH are often anti-correlated.
% The same goes for two other pairs: 'CO2 and CO3' and 'pCO2 and
% CO3'. But even for these cases, care is needed when using non-zero values of 'r'.
% 
% When the user propagates errors for an individual
% measurement, 'r' should ALWAYS be zero if each member of the input pair is
% measured independently. In this case, we are interested in the
% correlation between the uncertainties in those measurements, not in
% the correlation between the measurments themselves. Uncertainties from
% those measurements are probably not correlated if they come from
% different instruments. Conversely, if users are interested in the
% error in the mean of a distribution of measurements (i.e., if they are
% propagating standard errors instead of standard deviations), one
% should then also account for the correlation between the measurements of
% the two variables of the input pair.
% 
% For input pairs where one member is pH, this 'errors' routine automatically
% inverses the sign of 'r'.
% That inversion is done because the associated derivatives are computed in terms of 
% the hydrogen ion concentration H+, not pH. Therefore for each of these 6
% flags, if the user wants to compute 'r' that should be done (1) using
% the H+ concentration instead of pH, and (2) the sign of that computed 'r'
% should be inversed when passing it as an argument to this routine.
% To express perfect anticorrelation with pH, the user should 
% use 'r=-1.0'. 
% 
%**************************************************************************
%
% OUTPUT: * an array containing uncertainty for the following variables
%           (one row per sample):
%         *  a cell-array containing crudely formatted headers
%
%    POS  PARAMETER        UNIT
%
%    01 - TAlk                 (umol/kg)
%    02 - TCO2                 (umol/kg)
%    03   fCO2in               (uatm)
%    04 - HCO3in               (umol/kg)
%    05 - CO3in                (umol/kg)
%    06 - CO2in                (umol/kg)
%    07 - OmegaCAin            ()
%    08 - OmegaARin            ()
%    09 - xCO2in               (ppm)
%    10 - Hout                 (nmol/kg)
%    11 - pCO2out              (uatm)
%    12 - fCO2out              (uatm)
%    13 - HCO3out              (umol/kg)
%    14 - CO3out               (umol/kg)
%    15 - CO2out               (umol/kg)
%    16 - OmegaCAout           ()
%    17 - OmegaARout           ()
%    18 - xCO2out              (ppm)
%
% NOTE: Only uncertainties for the output variables are provided.
%       The 1st 2 columns will change as a function of PAR1TYPE and PAR2TYPE.
%       In the case above, the input pair is pH-pCO2 (PAR1TYPE=3, PAR2TYPE=4).
%       That is why the results in the first 2 columns are for the other 2
%       possible input variables (TAlk and TCO2)
%
% EXAMPLE: a nice way to see the headers & units along with the results
%
% [e, ehead, eunits] = errors (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,...
%                              ePAR1,ePAR2,eSAL,eTEMP,eSI,ePO4,epK,eBt,r,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
%
%  printf("%s   %s %s %s %s  %s %s %s %s \n", ehead{1:9});
%  printf("%s   %s  %s    %s %s %s    %s      %s          %s \n", eunits{1:9});
%  printf("%f  %f  %f  %f  %f %f  %f     %f     %f \n", e(1:9));
  
function [total_error, headers, units] = ...
        errors (PAR1, PAR2, PAR1TYPE, PAR2TYPE, SAL, TEMPIN, TEMPOUT, PRESIN, PRESOUT, SI, PO4,...
                ePAR1, ePAR2, eSAL, eTEMP, eSI, ePO4, epK, eBt, r, ...
                pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);

    global K0 K1 K2 KW KB KF KS KP1 KP2 KP3 KSi;
    
    % Input conditioning
    % ------------------

    % Determine lengths of input vectors
    veclengths=[length(PAR1) length(PAR2) length(PAR1TYPE)...
                length(PAR2TYPE) length(SAL) length(TEMPIN)...
                length(TEMPOUT) length(PRESIN) length(PRESOUT)...
                length(SI) length(PO4) length(ePAR1) length(ePAR2)...
                length(eSAL) length(eTEMP)...
                length(eSI) length(ePO4) length(r) length(pHSCALEIN)...
                length(K1K2CONSTANTS) length(KSO4CONSTANTS)];

    if length(unique(veclengths))>2
            disp(' '); disp('*** INPUT ERROR: Input vectors must all be of same length, or of length 1. ***'); disp(' '); return
    end

    % Make column vectors of all input vectors
    PAR1         =PAR1         (:);
    PAR2         =PAR2         (:);
    PAR1TYPE     =PAR1TYPE     (:);
    PAR2TYPE     =PAR2TYPE     (:);
    SAL          =SAL          (:);
    TEMPIN       =TEMPIN       (:);
    TEMPOUT      =TEMPOUT      (:);
    PRESIN       =PRESIN       (:);
    PRESOUT      =PRESOUT      (:);
    SI           =SI           (:);
    PO4          =PO4          (:);
    ePAR1        =ePAR1        (:);
    ePAR2        =ePAR2        (:);
    eSAL         =eSAL         (:);
    eTEMP        =eTEMP        (:);
    eSI          =eSI          (:);
    ePO4         =ePO4         (:);
    r            =r            (:);
    pHSCALEIN    =pHSCALEIN    (:);
    K1K2CONSTANTS=K1K2CONSTANTS(:);
    KSO4CONSTANTS=KSO4CONSTANTS(:);

    % Find the longest column vector:
    ntps = max(veclengths);

    % Populate column vectors
    PAR1(1:ntps,1)          = PAR1(:)          ;
    PAR2(1:ntps,1)          = PAR2(:)          ;
    PAR1TYPE(1:ntps,1)      = PAR1TYPE(:)      ;
    PAR2TYPE(1:ntps,1)      = PAR2TYPE(:)      ;
    SAL(1:ntps,1)           = SAL(:)           ;
    TEMPIN(1:ntps,1)        = TEMPIN(:)        ;
    TEMPOUT(1:ntps,1)       = TEMPOUT(:)       ;
    PRESIN(1:ntps,1)        = PRESIN(:)        ;
    PRESOUT(1:ntps,1)       = PRESOUT(:)       ;
    SI(1:ntps,1)            = SI(:)            ;
    PO4(1:ntps,1)           = PO4(:)           ;
    ePAR1(1:ntps,1)         = ePAR1(:)         ;
    ePAR2(1:ntps,1)         = ePAR2(:)         ;
    eSAL(1:ntps,1)          = eSAL(:)          ;
    eTEMP(1:ntps,1)         = eTEMP(:)         ;
    eSI(1:ntps,1)           = eSI(:)           ;
    ePO4(1:ntps,1)          = ePO4(:)          ;
    r(1:ntps,1)             = r(:)             ;
    pHSCALEIN(1:ntps,1)     = pHSCALEIN(:)     ;
    K1K2CONSTANTS(1:ntps,1) = K1K2CONSTANTS(:) ;
    KSO4CONSTANTS(1:ntps,1) = KSO4CONSTANTS(:) ;

    % Default values for epK
    if (isempty(epK))
        epK = [0.002, 0.0075, 0.015, 0.01, 0.01, 0.02, 0.02];
    else
        % Check validity of epK
        if (length(epK) == 1 && epK == 0)
            % this means that the caller does not want to account for errors on dissoc. constants
            epK = [0.0 0.0 0.0 0.0 0.0 0.0 0.0];
        elseif (length(epK) ~= 7)
            error ('invalid parameter epK: ', epK)
        end
    end
    
    % Default value for eBt (also check for incorrectly specified values
    if (isempty(eBt))
        eBt = 0.02;
    elseif ( ~(isscalar(eBt)) )
        error ('invalid parameter eBt (must be scalar): ')
    elseif ( isscalar(eBt))
        if (eBt < 0 || eBt > 1)
           error ('The "eBt" input argument is the fractional error. It must be between 0 and 1. Default is 0.02 (a 2% error).')
	end
    end

    % names of dissociation constants
    Knames = {'K0','K1','K2','Kb','Kw','Kspa', 'Kspc'};

    % Convert error on pH to error on [H+] concentration
    % in case where first input variable is pH
    isH = (PAR1TYPE == 3);
    
    pH = PAR1(isH);
    epH = ePAR1(isH);       % Error on pH
    H  = 10.^(-pH);         % H+ concentration
    r(isH) = -r(isH);       % Inverse sign of 'r' if PAR1 is pH

    % dpH = d(-log10[H])
    %     = d(- ln[H] / ln[10] )
    %     = -(1/ln[10]) * d (ln[H])
    %     = -(1/ln[10]) * (dH / H)
    % Thus dH = - ln[1O] * [H] dpH
    eH =  log(10) * (H .* epH);     % Removed the minus sign because all errors (sigmas) are positive by definition
    eH =  eH * 1e9            ;     % Convert from mol/kg to nmol/kg (to have same units as partial derivative)
    ePAR1(isH) = eH;

    % Same conversion for second variable
    isH = (PAR2TYPE == 3);
    pH = PAR2(isH);
    epH = ePAR2(isH);       % Error on pH
    H  = 10.^(-pH);         % H+ concentration
    r(isH) = -r(isH);       % Inverse sign of 'r' if PAR2 is pH

    eH =   log(10) * (H .* epH);
    eH =  eH * 1e9             ;
    ePAR2(isH) = eH;

    % initialise total square error
    sq_err = zeros(ntps,1);
        
    % Contribution of PAR1 to squared standard error
    if (any (ePAR1 ~= 0.0))
        % Compute sensitivities (partial derivatives)
        [deriv1, headers, units, headers_err, units_err] = derivnum ('PAR1',PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
        %err = deriv1 .* ePAR1;
        err = bsxfun(@times,deriv1,ePAR1);
	%sq_err = err*0. + sq_err;
	sq_err = bsxfun(@plus,err*0., sq_err);
        sq_err = sq_err + err .* err;
    end

    % Contribution of PAR2 to squared standard error
    if (any (ePAR2 ~= 0.0))
        % Compute sensitivities (partial derivatives)
        [deriv2, headers, units, headers_err, units_err] = derivnum ('PAR2',PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
        %err = deriv2 .* ePAR2;
        err = bsxfun(@times,deriv2,ePAR2);
	%sq_err = err*0. + sq_err;
	sq_err = bsxfun(@plus,err*0., sq_err);
        sq_err = sq_err + err .* err;
    end

    % Contribution of covariance of PAR1 and PAR2 to squared standard error
    if (any (r ~= 0.0) && any (ePAR1 ~= 0.0) && any (ePAR2 ~= 0.0))
        % Compute covariance from correlation coeff. & std deviations
        covariance = r .* ePAR1 .* ePAR2;
        % Contribution to squared error
        %err2 = 2 * deriv1 .* deriv2 .* covariance;
        err2 = bsxfun(@times,2 * deriv1 .* deriv2, covariance);
        sq_err = sq_err + err2;
    end
    
    % Contribution of Silion (total dissolved inorganic concentration) to squared standard error
    %
    % Remark : does not compute error where SI = 0 
    %          because computation of sensitivity to SI fails in that case
    %
    SI_valid = (SI ~= 0) & (eSI ~= 0);
    if (any (SI_valid))
        % Compute sensitivities (partial derivatives)
        [deriv, headers, units, headers_err, units_err] = derivnum ('sil',PAR1(SI_valid),PAR2(SI_valid),PAR1TYPE(SI_valid),PAR2TYPE(SI_valid),...
                   SAL(SI_valid),TEMPIN(SI_valid),TEMPOUT(SI_valid),PRESIN(SI_valid),PRESOUT(SI_valid),...
                   SI(SI_valid),PO4(SI_valid),pHSCALEIN(SI_valid),K1K2CONSTANTS(SI_valid),KSO4CONSTANTS(SI_valid));
        %err = deriv .* eSI(SI_valid);
        err = bsxfun(@times,deriv,eSI(SI_valid));
        new_size = [ntps size(err,2)];
	sq_err = zeros(new_size) + sq_err;
        sq_err(SI_valid,:) = sq_err(SI_valid,:) + err .* err;
    end

    % Contribution of Phosphorus (total dissoloved inorganic concentration) to squared standard error
    %
    % Remark : does not compute error where PO4 = 0 
    %          because computation of sensitivity to PO4 fails in that case
    %
    PO4_valid = (PO4 ~= 0) & (ePO4 ~= 0);
    if (any (PO4_valid))
        % Compute sensitivities (partial derivatives)
        [deriv, headers, units, headers_err, units_err] = derivnum ('phos',PAR1(PO4_valid),PAR2(PO4_valid),PAR1TYPE(PO4_valid),PAR2TYPE(PO4_valid),...
                   SAL(PO4_valid),TEMPIN(PO4_valid),TEMPOUT(PO4_valid),PRESIN(PO4_valid),PRESOUT(PO4_valid),...
                   SI(PO4_valid),PO4(PO4_valid),pHSCALEIN(PO4_valid),K1K2CONSTANTS(PO4_valid),KSO4CONSTANTS(PO4_valid));
        %err = deriv .* ePO4(PO4_valid);
        err = bsxfun(@times,deriv,ePO4(PO4_valid));
        new_size = [ntps size(err,2)];
	sq_err = zeros(new_size) + sq_err;
        sq_err(PO4_valid,:) = sq_err(PO4_valid,:) + err .* err;
    end

    % Contribution of T (temperature) to squared standard error
    if (any (eTEMP ~= 0.0))
        % Compute sensitivities (partial derivatives)
        [deriv, headers, units, headers_err, units_err] = derivnum ('T',PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
        %err = deriv .* eTEMP;
        err = bsxfun(@times,deriv,eTEMP);
	sq_err = err*0. + sq_err;
        sq_err = sq_err + err .* err;
    end

    % Contribution of S (salinity) to squared standard error
    if (any (eSAL ~= 0.0))
        % Compute sensitivities (partial derivatives)
        [deriv, headers, units, headers_err, units_err] = derivnum ('S',PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
        %err = deriv .* eSAL;
        err = bsxfun(@times,deriv,eSAL);
	sq_err = err*0. + sq_err;
        sq_err = sq_err + err .* err;
    end

    % Calculate dissociation constants
    data = CO2SYS (PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
        
    % Calculate [Ca++]
    % '       Riley, J. P. and Tongudai, M., Chemical Geology 2:263-269, 1967:
    % '       this is .010285.*Sali./35
    Ca = 0.02128./40.087.*(SAL./1.80655);% ' in mol/kg-SW

    % Contribution of all pKi to squared standard error
    for i = 1:length(epK)

        % if error on Ki is given
        if (epK(i) ~= 0.0)
            % Select Ki
            switch i
                case 1
                  Ki = data(:,53);   % K0
                case 2
                  Ki = data(:,54);   % K1
                case 3
                  Ki = data(:,55);   % K2
                case 4
                  Ki = data(:,59);   % KB
                case 5
                  Ki = data(:,58);   % KW
                case 6
                  % Recompute KAr from OmegaAr and ions [Ca++] and [CO3--] concentrations
                  OmegaAr = data(:,16);
                  CO3 = data(:,7) * 1e-6;
                  Ki = CO3.*Ca./OmegaAr;
                case 7
                  % Recompute KCa from OmegaCa and ions [Ca++] and [CO3--] concentrations
                  OmegaCa = data(:,15);
                  CO3 = data(:,7) * 1e-6;
                  Ki = CO3.*Ca./OmegaCa;
                case 8
                  Ki = data(:,79) * 1e-6 / log(10);  % TB   
                  % TB (divide by log(10) to multiply by same just below
                  % (not a pK value, unlike the others) 
            end

            % compute error on Ki from that on pKi
            eKi = - epK(i) * Ki * log(10);
            % Compute sensitivities (partial derivatives)
            [deriv, headers, units, headers_err, units_err] = derivnum (cell2mat(Knames(1,i)),PAR1,PAR2,PAR1TYPE,PAR2TYPE,SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
            %err = deriv .* eKi;
            err = bsxfun(@times, deriv, eKi);
            %disp('deriv = '), disp(deriv);
	    sq_err = err*0. + sq_err;
            sq_err = sq_err + err .* err;
        end
    end

    % Contribution of Boron (total dissoloved boron concentration) to squared standard error
    if (eBt ~= 0)
        % Compute sensitivities (partial derivatives)
        [deriv, headers, units, headers_err, units_err] = derivnum ('bor',PAR1,PAR2,PAR1TYPE,PAR2TYPE,...
                   SAL,TEMPIN,TEMPOUT,PRESIN,PRESOUT,...
                   SI,PO4,pHSCALEIN,K1K2CONSTANTS,KSO4CONSTANTS);
        err = deriv .* eBt  * data(:,79) * 1e-6 ;  % where TB = data(:,79) in umol B/kg
        new_size = [ntps size(err,2)];
	sq_err = zeros(new_size) + sq_err;
        sq_err = sq_err + err .* err;
    end

    % Compute and return resulting total error (or uncertainty)
    total_error = sqrt (sq_err);
    
    headers = strcat('u(',headers_err,')');
    units = strcat('(',units_err,')');
end
