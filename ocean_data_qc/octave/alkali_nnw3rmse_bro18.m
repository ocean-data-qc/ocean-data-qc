function [y1] = alkali_nnw3rmse_bro18(x1)
%NNX3RMSE_BRO18 neural network simulation function.
%
% Generated by Neural Network Toolbox function genFunction, 17-Sep-2018 11:00:41.
% 
% [y1] = NNx3RMSE_BRO18(x1) takes these arguments:
%   x = 10xQ matrix, input #1
% and returns:
%   y = 1xQ matrix, output #1
% where Q is the number of samples.
%{
-NN.mat & NNw3RMSE

These two files are the neural network objects for each of the networks used in the study. To use any of them you need MATLAB software with the Neural Network Toolbox.

Example of use of the neural networks:

AT_values=Neural_network_object(data_inputs); %This code line must be written in the command window.

AT_values: row vector with computed values of AT by the neural network used. The size is equal to that of datainputs

Neural_network_object: NN or NNw3RMSE

data_inputs: 2D matrix. Size must be 10 rows by n columns. Where n is the number of samples where AT will be computed. Each row is a variable and each column is a sample. The order of the variables has to be the following: 1º) latitude; 2º) clon; 3º) slon; 4º) depth; 5º) potential temperature; 6º) salinity; 7º) phosphate; 8º) nitrate; 9º) silicate; 10º) oxygen. The units must be: latitude and longitude in [-90º:90º] and [-180º:180º] format; depth in m; potential temperature in ºC; and nutrients and oxygen in umol/kg.

%}


%#ok<*RPMT0>

% ===== NEURAL NETWORK CONSTANTS =====

% Input 1
x1_step1.xoffset = [-77.9606;-1;-1;0;-2.19;5.26763;0;0;0;0];
x1_step1.gain = [0.0119075545098077;1;1.00000000007615;0.000279876854184159;0.058208064727368;0.0565844974886385;0.576186223387399;0.0432304376865664;0.00826630735784018;0.00280544255856361];
x1_step1.ymin = -1;

% Layer 1
b1 = [-3.1077131834493441076;-0.21489506449100265195;-2.5474116148959859984;-1.3138798782177185664;1.8038772217868657144;0.11509647536639787402;1.287666581866118598;-3.61137511748276685;0.75872554353297683161;-2.2668830068627805474;-3.6974668725567925165;-2.7804111569042491148;1.3649104844428088246;-3.8024879452951041436;-0.90530780615133632505;-3.1324615099665962248;1.3218397413623568237;-1.2090722924427839136;-2.5109566219039973767;1.4546070605424106237;-2.8164797524245637206;-0.41833481172155456695;-0.86248302255899333968;1.3347598873413080156;2.3695866491627310957;-2.1682108081130451183;-4.9818955999103096133;-0.14522864511553124078;-1.5831633447654933633;-3.0850253100674680518;-0.12381593086936049097;-0.13258718999840682362;-0.98300488496319349263;2.3260706901087608856;1.9233063443577538276;-1.2230270842992845282;-1.0196737522668271048;0.10944571599448282839;2.5920529604109079358;2.4832315139899572287;-1.0523043823712041611;-0.071499279823170280856;1.7183347223591753927;-0.250080247377360676;1.1454565377279051219;-0.20913992967788247457;-3.1332149890117650948;-0.30922678667999375923;1.2762671144190358419;0.081921862880764473314;0.10961115534211610112;-0.33230223472197611967;-2.0462818549370567212;1.0508271322312869867;-1.7435807262159301878;-1.7378977430237176893;3.2865086482106486976;2.3070494303956783355;2.4561900230049591443;-0.85812047134092117595;-0.8524187448923604693;1.3430531424368552518;1.6113432016233535382;0.9567604228245165654;1.605435057712327751;-0.55447191239982962507;-1.1249147871076676797;2.4390602786019055515;-2.3925622715930363604;-1.7252232375720957247;0.27995490065446987371;-0.75255942931803532225;0.78824847117397889296;-0.31641607865435450453;-0.18248169948010609098;0.22748434884062929129;1.261196019356653153;0.51181764386008010703;-1.0191621120228488984;0.75383853366125563866;-0.69813877706040516902;0.56023973727013376411;-0.36730076120405702467;0.17145776197443995947;0.7108780172139861353;0.22186162928153374541;-0.13889267201541333208;0.059734769574386462065;-2.5728981554178762536;-0.058556024168838025079;-0.23967307916369620657;1.1988497535192166321;1.7365066532104771468;2.3199398176506118574;-1.1142836986108444197;-0.030097420936627858334;0.16769498993239354001;-0.39297196996532673952;-0.12844100097341129563;0.9335412464647615538;-0.14705715026613380703;0.046163446289994393423;-2.0917048801360240695;-1.9858683833284453968;4.5356626123411185603;1.0014570780933784722;-1.1320100820355045723;2.1780873207155551086;-0.59107768332564747382;1.9328446696989856068;2.0141599956268350091;2.5377501616474824608;-2.3560083429562697077;2.343648870925723493;1.7068108658318823512;-2.6503829231168456459;-1.8697913635503684571;4.6051025357541712779;2.3281403435535317215;1.8732120360515884805;-2.1992001128616660566;-0.30835010998084222411;0.60084095489328626094;-4.2218874139061703943;4.7107266509135774513;-1.0253720064674880508;2.660062169797690057;2.9605473819936580782];
IW1_1 = [1.6438173516746699132 0.29712452822853974155 0.048047219943992289237 -0.19285014042412079727 0.19376602128271130931 2.934233173379473758 -0.22960365919028141724 -0.0074666355097556093637 0.37416687661023939615 0.34176004071432430909;-1.8083112701631713914 -0.45546006780715453388 -0.043721107483749042932 -0.021956659022079487442 -0.74540862446576605649 0.96266269248136426828 0.61765351011922864366 -0.7295538547787582262 -0.65335391286575073 -0.37655193263755776245;-0.28757733432583876265 -0.00093020369652403148315 0.52202403348105352876 -0.051729012387245927596 0.34050746876242948824 2.0001846705524002346 0.46057641304795005066 0.48224084184168819478 -0.46707932085262826583 0.36396188646667920752;0.74520684020485605803 0.51979263154246702072 -2.092629598457664386 -0.58650690408141747945 -0.78482777432420647301 -2.6641382643082360815 0.038910410886966576016 -0.47698707939740120354 -0.37025684893612037518 0.029101126741187595404;0.46510618021408267619 0.76127553623729093957 0.38593475130864501876 -0.051785325297033876768 -0.59317952733523560127 0.14663288790059331168 -0.12631209043119001612 -0.79292553948636934624 -0.47442279802865305882 0.69835013931143286037;1.3489629989479334782 -1.4771947833015599549 -0.53808084820657531289 -0.36159397347950328339 2.0066423329920963781 -2.9672793441193614505 1.678997460549451981 -0.87815096931838354521 0.41799554233144231574 0.68401323491464316451;1.6919590106333930457 1.4306379251776706329 0.00030531624759603625922 -1.3743310572231739464 1.1281007994169889308 -0.61132622840264272401 2.7468790201224670966 -0.66166147988262280499 -0.40393717428666220393 -2.0579866055571645056;0.64009818667158280281 0.43058859481902428401 0.53057534921043880694 -0.62428457558535555005 -1.1594989782198001915 -0.0017112039764055507127 -0.57771501179879602983 -0.93788655361132056143 1.5846433887633561977 -0.30087205651480714019;-0.6439426009701614273 -0.25886602338825620562 0.29535110592421071063 0.64025827111703048633 -1.2088379773836139819 0.58723554982592418572 1.5151251821976954304 -2.6719635440359836842 1.6058731908414851652 -0.79007536567466896127;1.7675768872447412683 1.0848619267586325776 -1.4178780414441802815 0.30885762186680509878 -0.43591367731583735567 0.75732694078772666568 0.10145486758982574793 0.047500454802492098061 -0.66031081791629286926 -0.62122923602030710732;0.11013899915870559165 -1.702302544574088472 -0.21835977276186260831 0.51020138806282733235 0.62297843399480490323 3.7881573021366659049 -0.086552792679105594598 0.79048227005075000218 0.060038028025263631693 -0.17398960392999424096;0.28288499718829529517 -1.4064178149317154709 -1.8896350508823560599 -0.33526578294221520693 -0.38405604767040352199 -3.3522688814047114647 -2.6545519917209992045 0.028206922281839286876 0.97347045476923821372 -0.13923752708941578016;-0.38117818960628718772 -0.47005258709794811578 -0.0076465566134866986073 0.51741705699348716774 0.62281392636124455198 0.51657524286312184181 0.86650541972260453072 0.058665856105585889591 -0.042773361203342324943 -0.14495855743987742792;0.62557895118292428105 2.2342514210247133022 0.4138123244143071533 -0.10000304858875433411 -0.44081212343743064741 2.2918661985679054105 1.6992128652227549424 -1.7558299664601964007 -0.82646655568618410115 -0.45603004433454452649;0.37735218048907442911 1.8912587579239272806 -0.68890196749449361668 0.35689177873355815152 -1.6651709012613116201 -0.13141392464958118191 0.64254003919821389701 1.3973891560292377445 -0.50843978213508178587 0.77582084572155318725;0.5833841589223246471 0.91858370952742340876 -0.3705666139934724046 0.90379607660269090097 -1.5588666180644490389 2.9024680332475640832 -0.074604633274725870584 0.069043287525355781509 0.72292232547932222531 -0.15699917268577956442;0.44201194898146473067 1.2748825456754540042 -0.60697852868403689985 -0.57018670471642785014 -1.1490080441600090122 -3.8521999742397450284 -0.10807354550304015817 -0.68848092447390896176 0.26989212188229777523 -0.31099473089332563269;-1.0461462470794744561 0.96723557373901880574 0.24251109949577304148 -0.64828322413113470546 -2.0344411070636332362 2.895182631679336982 -1.6535781236625464174 0.93722101253543665944 -0.37823700583436520306 -0.50449002824299749026;1.6826561161822350954 -0.17528498982699941555 -0.45444819643939360354 0.070330213179321976469 -0.83751648157340341516 2.4496395859388289118 1.5276281197391305966 -0.66873662934196176355 0.0097998810303770098051 -0.11240094019441329576;-0.64227450967947108396 0.42373188094064156983 -0.060184798544054222968 0.38723724903026890409 0.60684155559666019819 0.47872310608837947976 0.99195035898000349928 0.5914907363576682453 -0.30493719912260230931 0.18738189688844975045;1.7289563190056691511 -0.61700969288775653343 0.77700376646142488291 -0.08912102958442351397 0.30058675958642600001 3.1552891467443768825 0.13658196486502777178 0.51005587562188492434 -0.20059685306959126883 -1.2375603028832808938;-0.38902629063417565325 0.90064103898945990778 1.2782521185414408293 0.20420968234669625851 0.94694361450670749836 -0.20453447022716264581 0.6132055379141342355 -0.69860816032145200971 -0.29128860207624740486 0.58226008692157460445;0.4247227042673059616 -0.41533469481812224089 -0.019036777928843184177 -0.21086689396695543208 -0.55900788431136327894 -0.61305380548978594124 -0.95985328912713907545 -0.44117097556452128382 0.58587264692196550087 -0.10222540632178374331;-1.1148468300560203659 0.44861946010221737113 1.168562993192493682 0.55124177762111625789 -0.58897984025712812883 -1.2513380611549764776 0.047424461445272229898 0.24985982937213288557 0.08813523656273045126 -0.43258038698890760587;-0.93655287258487829316 0.81746048626331890841 -1.4580803397950152789 -0.65443553017617417389 1.227566283668804159 -1.1974025281848275082 1.3644930708359581661 -0.2883643610509512567 -0.73984441379034560082 0.89680107426445609953;-0.16150027412095585566 -0.26108295705491763039 -0.31437187728418480859 0.45961569870070778654 -0.47802784369564510492 1.729493356414651295 -0.27623307833798838029 0.44972962089830775811 0.59625058170192768436 -1.501395678678546064;0.063070891559719330366 -0.21890032278732829418 0.044722631233143621265 -1.6551716693543334635 -0.93830782010288582562 -0.68389782316312308641 -1.1800265113455701282 -1.3754634579590789834 1.4506865079457886836 0.79767839970476239753;1.0224332766338832812 -0.74919810257229468853 -0.087879482467808037183 0.17051174702757826429 2.0549005996261651141 -0.38175884216786720726 0.98459417116054814834 -0.90871439281824351042 0.74623559753446955245 0.24591507681517940642;1.1611756835411553013 0.41896388948664564644 -0.021473035613847606118 -0.014962472211744426778 0.054890557492911482007 1.9538759460786068178 -0.44402833918476225517 -0.10143388627327785956 -0.21067382487228958343 0.23209887471382426027;1.7787110016458584916 -0.62115694100734974992 0.73042641048898282463 -0.12448295174765026949 0.25804426840709199231 3.4460042676413564777 0.22220522835294409525 0.44646204468187561387 -0.2415294063056410423 -1.2437974438197103577;1.2759263131925626666 0.50101456500335306288 0.22296205955605472027 0.14972340305126782822 0.9350502781424971932 -0.23181569855985897921 -0.34153503072637619864 0.66123239495812158317 0.85877189673935871994 0.18099053621099031597;1.1772031366501507499 0.21933081375961802073 0.21840835505853684051 0.36606557359517505335 -0.36302062545831265128 -4.1365916387310077695 3.0527072056366422181 -2.143888103775509979 -0.14741876662905559203 0.57373692165163947543;0.064827604485944864687 -0.39500418676425025355 -1.2154561810296053981 0.48004435768928949146 0.82789392832668751154 1.4171024835726362401 -1.8593362928984673577 0.10412214259978812281 -0.061265917185013486768 -0.67851207662123536046;-0.18435365388952779098 0.094864798258431498601 0.27517422014826048438 -0.53116163745640543326 0.72664773259886505929 -3.2200153334487571222 0.58466717943989510164 -0.43842910604309975886 -0.41080888873331716793 -0.44062143052443508706;2.2984314651409945007 0.74079069328418778451 -0.05201258934714179244 0.23312382473785761561 1.2557639764724346509 -3.3405979971622077329 -0.96168172728628631418 1.1396210407963212052 0.4579010326498556549 0.57685517430663268978;0.89438258477294818594 0.72367026680204271649 0.62624584309299557994 0.54615552394175070905 -1.1999801246496735185 -0.32461607205508941076 0.49760986744711799279 0.023930828354290882565 -0.15414901346629741874 -0.31801905528839663484;0.11372714263950803315 2.1783638288825897256 0.81208152772998543067 0.48802544038123840675 -0.80439093848743759008 -1.9378850027063574402 0.19541422279078740631 0.30704335890489559135 0.10983512240189954867 0.14088913858462165374;-0.41974879723536390186 -1.2156808417778601772 -1.2261088007063201122 -0.21186607730869000399 -1.6322552267507768331 1.3246635095152305972 -0.6054796540500149149 0.23899420644038485428 0.37925146880485877121 0.32233491079461507045;-0.62586283145970222908 0.5258232364332245945 1.5464706052790164748 -0.26732101458274482031 1.9178131712213535298 0.65536500029842825743 -0.21443486068497219499 -0.069027548667645280411 0.27562138761303855983 -0.85921301708072184145;0.078170477301641713708 -0.68061011368773471908 0.83340645005928826183 -0.43346160909625658375 1.1954492407071160009 -3.5175744887499624802 -0.82716942288209061029 0.5715353722737090969 -0.50648786929789235689 -0.26358819072035544195;-0.2211268742368860396 1.0693654508094954103 0.17819522326400696888 0.24988029343035114693 -2.2988452624397530677 0.73355477686703374207 -0.3478312992448742702 0.73028053141936388748 -0.69306597632990973867 -0.87289757758139319144;-0.77885592662502800554 -0.9998080437329224246 -0.46308921950628051389 0.040710476130864509114 -1.628465529662221245 0.35150943642305848558 0.20281639904860795931 -0.88317184227353973114 -1.4455778627072071174 -0.21417113644581553533;-1.2718538693596026512 -0.64349577900227450389 0.65873020250489666694 0.17583311389029546157 0.7249530580830189086 -0.33618294819168281773 -0.15590222416692584018 0.22304561627115568334 0.51019377090086115434 0.71192863059457878183;-0.037241840452641075676 -0.087011047540366884268 -0.61774230840932919939 0.58692394384575563571 -0.057505727322569741289 2.29471899880536645 0.11287105863130648953 -0.18536508942093871122 -0.07343229208736176683 0.25623565212694476845;-1.3524168530319153891 0.31304694271111649373 -0.0084584383623860174423 -0.55549887024295452331 2.7027086595539135949 2.8377228139038992438 1.7024688409662969146 0.24318914624184789774 -0.90492518100998320385 2.9962610866029262269;0.46522391660604756058 0.41497980844141085788 -0.50741393258178879577 -0.75747045264928003494 -1.3648037840534730236 -1.3733852190508155644 -1.0882547319027000565 -0.07138956322857699377 -0.071260766048472895529 -0.13849618865172833027;4.3550314127475466819 -3.4666982210763279681 0.25753081417570539147 -0.60080542468680697699 -2.4548625895327704782 0.68976267286436643289 0.70754666693102141739 -1.8975722616975969625 -0.0040567062659127399449 -3.5630965977446744652;0.51614094984023717316 -0.042080293534525074761 0.056895429943838157771 0.023970155136114265626 -0.1204783742764200527 -0.36256490887481640506 -1.075032516833680285 0.050457690261442880719 -0.3963185411214625864 -0.85197743025191308153;-0.5351571473704778148 -0.54955447368194754176 -0.58157013209797703279 -0.024835196383171349171 0.71431426338926351516 -0.51125740734120772579 -1.166697316857421507 0.22023860499282013614 0.84283576819056016394 0.96448752689036643115;-0.24620624637667182233 -1.0607348920806380921 -1.0377517891352590063 -0.21805745840927698298 -1.7106728050392725482 0.87685999546038961849 -0.97014927853251786694 0.3459927203313602484 0.41300850272299061139 0.064589282829143446207;-0.45062059434746082331 0.77142228851383931598 1.6737341478761331715 -0.55161297031400746693 0.17053923343394936096 2.4615087777580839656 -1.2410421042563868355 0.45604408145130459484 -0.65057222198217556919 -1.7615224752707465683;0.90580377226260899715 -1.5657313467082323299 1.696125729246131586 0.90617406087752316868 -0.11315460341043807879 -1.0462261715067040502 -1.8469285581018419773 0.5117563144350979476 0.13105095816475717529 -1.1618836761180428852;0.88983744953543408851 0.41460931666843509058 -1.4841299399872809328 -0.11582500102015297339 0.57448757374797376762 0.0051520034666249700517 -1.0936632956959464469 0.10823922516313856657 -0.2736907085416938612 -0.44178525298060417059;-0.43810663909366692748 -0.57409230793625820599 -0.55520087619906199894 -0.14570349818095984507 0.58427475599527356476 -0.54502444176934194964 -1.1447972869052209788 0.20761183818540310253 0.75159322148232521332 0.86118799668911072409;-2.7505755286562996176 1.7537976516287387962 3.0383680029331916472 0.73123755272304236108 -2.4089810815344430139 -1.6835989143689322756 1.9962037814205770836 0.047461481452357595634 -1.5383032205424524985 1.6354294138291765037;-0.68459076001429697289 1.5595114418570656944 -1.582680798283343071 -0.11062632162072351394 -1.4890027659779687674 0.86761852475184364497 -0.45960580507059656252 -1.7038670090728118556 -0.35319589948095009291 -0.4357408100463343037;-0.6605455133168866011 -1.0351376108575112145 -1.3919170330885066722 0.41939089768611947928 0.29591294351731978196 -3.3836241694503348398 0.94101911953756867124 -1.3055779412210011259 0.023388874622395281616 -0.93556842386741501105;-2.7521224668963046867 -1.157405884448017952 3.4371785097559328648 0.57597961386559581864 -1.8747202115209791184 -2.7068529501499107859 -0.91760110213783574462 0.15890997346116053635 -1.3697848018381024726 0.16248658169519980543;0.49293280850260245973 -0.34053494960008273695 0.074119731034134661574 -0.47192143766298827456 -0.35222615800871565073 -6.7490091047122646728 -0.69887612519234687536 -0.098251650385319522218 -1.2263985904731535825 -0.48450888768626765302;-0.26431473181503883918 -0.14632608644914477103 0.41835194262577496405 -0.12426930142111090871 1.0923334041131291805 1.4542974479678927313 -1.0117104644512060485 0.91359890507608010335 -0.43967854154776225828 -0.35052397729414247474;0.39089912387079706058 -1.3283222451957101828 3.1043298136962467204 0.0037550768206870747089 -1.1915172913850764491 2.0908630402980610263 -1.4396593123924292801 0.27504589305674831401 -0.63671993133614013249 -0.65020159299594904034;-0.34610528332845008626 1.448093568081133542 -1.2789978992742747632 -0.23307428788831560662 1.757441203101980598 -1.8583576608647727202 0.54847170658865851411 0.010381459304475574093 -1.2734523017470535944 -0.069228608523718121459;0.020934999624897716181 -1.982880722945186136 -0.75945254899434944118 -0.47523693536776312474 0.66099160235837783883 0.67353905286978577038 -0.34538221958895337638 -0.094296013094232938867 -0.24709090259999783035 -0.2613765031700142627;-0.31860970683912359647 0.030336220348556722226 0.058841014398408594821 0.23153662717924625158 -0.45869937638351060416 -0.95755369581515048516 0.52572902147266875605 -0.10999572914675412316 0.76232778592335237455 0.51128144170971145943;0.66166599165394779369 0.82420343198135648244 0.88252957980941493243 0.011992261436495123619 0.28029207976408099245 -2.3660359326965583193 -0.1514927609720883861 -0.48268911194838659551 0.23718929246429451552 -0.46548104787484056999;0.22404003803937172501 1.350205796487609522 -0.85791544391960206095 0.62676564281414015589 -0.10757912544941453103 3.1141683165587212834 -0.34148601466807326776 -0.43452321101236235368 0.95542731026550542506 0.90605388238640649501;0.55838076133382608113 -0.46105641896087651288 -1.4832598796887315196 0.40465932237646778935 -2.234260108220686103 -2.5944348931581528994 0.39606040062724462425 -0.079500826236023433569 0.0026606047713952983395 0.82536674417092037448;0.43378788565346215744 -0.37631880135788881026 0.039525617544602924258 -0.43280055503974151909 -0.35312306380369895553 -6.6507606395040195224 -0.67836363278977995783 -0.13561964897200354252 -1.1679753512029680262 -0.46029556062720333731;-0.89401314888358285327 0.10939248449277370889 1.1141890146913346893 0.47807390717509384848 -1.4804575932743373468 2.6627490597973890729 0.53941628554162091014 -0.3510220182294198632 -0.47865350286068913954 -0.25571852226598784652;-0.046963863328951020726 -0.17372108015592907515 -0.42276583013170376812 -0.45748440318651989456 -0.25920088804457358522 2.0455145254987932013 0.95576093475299583879 0.057702720922666587977 -0.12336978489892654054 -0.28296602873279919077;0.13191491764256194075 -0.22149123155952901709 -1.0248988546857353832 0.60912757587311217033 0.74292200339627978423 0.023942807230682601471 -1.6052387972479000844 -0.0093394623157595432761 0.054509266553680810197 -0.68156681514448536063;0.68832184080996305919 1.681232301525722006 0.19971525119038266438 -0.24981302675617469977 -0.29973168392025650864 2.3403127601675564051 -0.65233833615358538527 -0.41796836694324340788 1.0611519062395102786 0.48867548416443301607;-0.60464698534592165036 -0.97918791929054871392 0.33419748510598523694 -0.87441147483200287738 1.4055478080169738764 0.43373402464493610031 0.14207903590441781083 -0.092487210266798139391 -0.76767609653672996828 0.23732194536401785001;-0.4901568882778133962 0.37443435308380712545 -0.14228993683663823666 -0.60593248921819653496 -1.3437891165462951815 1.3097051258686769337 -0.93819942767619390889 0.53947044238698882435 -0.23367287565903058222 -0.13883999051636383704;0.23854669937682287939 -2.017502421077864927 -2.0075423704717527684 0.36554809940994581474 0.099316239481830589919 -0.28274679906951377673 -0.23400965960159564316 -0.55277133721537674571 1.5819435392611240765 -0.97399376539488535798;1.3960266493453619141 -0.39428054106446308591 1.2967228027365467202 -0.3304002924526216467 0.070412220833126426545 -2.3760646604405075699 -0.69565960793683956354 0.1053992381377925891 -1.0312875571276611808 -0.60325252103811677351;-0.38716751953769218408 1.5264081302595693401 -1.3255466752643565442 -0.18256150350857791587 1.8198376595483460871 -1.7489368316708149287 0.58890381847184969377 -0.025254180223980560865 -1.3450873193373129588 -0.1536470032867476021;-0.47965700962321128342 0.50398134332204669317 0.95942540086728900217 0.13050620693889297685 2.1877802847961813626 0.71305343137797227993 1.679694168363565776 -0.07486128701958273679 -0.61574411152063945885 -0.30073018860074207659;1.2301222875338553298 0.24474559970985435009 -0.99039446482550741457 0.61708051302658772919 -0.30479298263843707106 0.032180943662275918182 -2.5655017014652314877 0.16830380304409167658 1.0577913932435121236 -0.73960321025510733506;-0.022049426535393750609 0.96246463853042552028 -0.30442289352532381219 0.018868908604915989036 0.64128850585420416053 1.8494456120630182738 0.70168587553556627245 0.40376169432289837902 -0.055664817091316570741 0.053050988726281528285;-0.99222590125680143469 0.89363190917199375463 -0.27252184602866430518 -1.4343964720241459965 -0.88018732555318646149 0.35109541443783359727 -1.8032892291761062342 1.1139294838896005579 0.38720413670592934707 2.4210574676334180033;-0.48178337780859598061 0.80323747763556385681 0.41098394465083187832 -0.089742801750906972535 1.2628896265379581099 1.8323916187564104341 0.33384259822649764438 0.3941184388803601335 0.7541340638139518715 0.25702890102681230644;0.8290813089867289376 -0.16796684672875503153 0.20266958432596557382 0.55132264733094948905 0.80187510037014453346 0.11394634163286465611 1.4945581922188193591 -0.49689862246222643583 0.14699710500128115864 0.81698797171848469567;-0.25155236150197113343 0.54101679236406730045 -0.44643355811273688349 -0.67813735765096361252 0.45769705897989815258 -1.3760159974268808547 -0.16047283838578452198 -0.044869536427116656074 0.5223534899320614322 0.13962118641968507271;0.21764396133410160439 -0.95693758658749261681 0.71932839492855804586 0.90636503979835758571 -0.28316265008129964942 1.2342289245431163902 0.37595156952522124083 -0.021827659786127082825 -0.70938411237583065549 -0.0010619880583675692792;-1.243486113312754382 0.32465128540435617133 -1.1634706204140450314 0.022776507537334660797 -0.20422112184944432589 1.0100962065534679901 0.81720170377389056426 -0.34731981294405417371 0.97506130030733806358 0.39672197786352730864;0.97801341931558571918 -1.1462360916766822783 0.36799492127922112106 0.49088330520523493217 -2.2214525002319396307 -1.0797443259062664556 -0.60205745708992486342 -0.28777418822962369527 -0.48910852715290958903 -0.68237505375898988014;-0.14108319927229043267 1.3143888640591203654 0.93182728594110475484 0.50733290677057440998 0.31488360296131412408 -2.5917330076554176976 1.2379983471800011241 -1.0386121358119606573 -1.2665077120730379168 -0.2004089519977376721;0.63693045353119281948 -0.17341236251188882345 1.0010908045291024848 -0.026086831268137555123 -0.95142944589141809075 2.478802067828830058 -0.44989447924979791837 -0.45401382715151777925 0.8134074706309472047 -0.51020389065222493397;-0.25504887167953899096 1.9148129220931831007 1.9618583795488455657 -0.30286117665596534732 -0.092396324876053592678 0.61868818875368458698 0.20390190371074046194 0.6504609777809673421 -1.6360066482161690349 1.0141893803048749323;-0.024616521185403000826 0.85312655043645602149 0.85195984570355731691 0.24678451897180009311 1.6656848320291661736 -0.17809131129781308189 1.1255441587760901534 -0.37343815611955938349 -0.36558306487018127351 0.15023459148007958786;0.91263126154029372561 0.31867755344944104223 -2.480642832781362106 0.001267621734662425538 -1.4353825639189674579 -0.31744681282071568473 -2.4641221185302444319 1.0981208935957693651 0.87016659328048473476 -1.7138970225604743813;-0.6130917595984272106 -2.3575337922567998206 -1.869739586816426824 -0.81531729949356457343 -1.9971887234266016975 -0.87578511703109795938 -1.5080309595574976633 -0.39582258804402076224 -1.3613461741346943867 -2.7818500527276546208;-0.21184457703430611963 0.16198406443401769383 0.27779379874023901742 -0.47622658591918243243 0.54502741423793055198 -3.5392668415337538157 0.70719928742626747553 -0.38460288879585591282 -0.51751834301744592537 -0.4447045243872546072;-1.5456902359447761697 -0.2490063177190173227 0.45436470017591695791 0.79939138365494877281 -0.53374011430193613048 -0.35268687607973836506 0.70402974196981005228 -0.65504883035280125902 1.7908073674070377201 -1.1995791218416143042;2.1246841225915531481 -1.3649813640468495546 2.3380139877534595882 0.011878998106965068735 -0.76732824481104333625 0.57720788857237104175 -0.50421379431441115671 -0.26294814628326595995 -0.29403768507159094847 -0.38990820084428912118;0.25149704034217656989 -0.67723130386770802325 0.57625969144932764898 0.85580165722890777502 0.16277682029907508676 0.91306260533466354623 0.98634507501676260688 -0.16199205584393228108 -0.44635897538906876836 0.13980200488225205668;0.34829349032045048284 -0.9909298745213394044 -1.5104012447996850721 -0.40123213979280114572 -0.90236777930904699119 1.6817989321526904956 -0.82236283884311589532 1.3341908001354563229 0.57960927588531929722 -0.73962494439577108896;0.69884417077171190336 0.33017730038323694908 0.3806440040743714337 -0.075072286891097059214 -1.0179635421883885815 0.68574137157336190196 -0.930255971459517772 -0.52020020619117013361 0.029065940316249899711 0.70924555590231608271;0.034379626636388979644 1.3355207674447715505 0.50512271862601143546 -0.052828355510810963425 0.11929216864689798361 -0.20884360664906126415 -1.1182563445261357593 1.3829724730539740829 -0.77054043573232655628 -0.13349933414050924041;1.2747879410325018146 -0.5581121751005514442 1.3650482248732349611 0.65902756771279036307 0.26495732823073536721 0.27024668858588846154 -1.2792953297794869005 1.1013114139041100259 0.41298262756250680994 -1.772159885766166898;-0.55723983537158183754 -0.036473235173505862139 -0.027775073493841138939 -0.44617109884400607545 0.16734538746578692114 -0.044448644904381044707 1.2368488517865381393 -0.0076755515014624445605 0.055100823787407972321 0.8660343717378105044;0.14033726503980123446 -0.38022885691565738719 -1.2614445633329161023 0.67520520155719154776 -0.20073899775014042435 1.7121610210686815101 -0.089456980084225812266 -0.81007187725113194432 1.7002080917476460886 1.6162771892453924316;-0.96670378369948795072 1.3794565651619150604 -0.19097609854745364877 0.6010979984122861719 -1.1551654068535741615 -1.2161433012949018906 0.6482267221099266008 -0.19433499958714778311 1.1138106123852142826 -0.4859836757060475021;5.202658754797119478 -0.6688780996153195213 0.10586897053764694754 0.84060777865109759244 1.1011495836076750088 1.8167865067825530456 2.2207941279813514512 -0.54917836435242850524 -0.62857188823209886319 0.58907398072016992074;-4.5156520537559536876 -2.9238089045136828048 2.4774604855108179891 -0.072436706343933829344 -2.6274201168722299826 6.8829585302775715405 2.4339474762254611484 -1.9690762090712403687 -1.4769684707325865247 -0.28606630577060038201;-1.1747311016886630153 -0.59697816125955316391 0.89244151339648214449 0.61836262408590592088 1.032770983315590696 2.0334430301271391173 0.14715580727604360423 -0.11815964927960641295 0.25153356632851880947 1.1746560655634246118;0.079235723071705260745 0.11388951745109335278 0.3629061630195560828 0.54534759366313423357 0.22603776016271628913 -2.3460031049244216561 -1.2101676297358727741 -0.11724896483258065438 0.27208578947696138162 0.59586179758314405941;-1.3679826131339869466 0.88929177781828849803 0.059679985620496735221 0.90229074760103122888 -1.013966664893239944 -1.0165386331230794603 0.50908762182442779398 -0.25122599773602261042 0.94964173279024222118 -0.53935085340501809359;0.98628248465850931748 0.38163584214386364613 -0.42657476337861660598 -0.83452628327613365133 -1.4860118658298866468 -2.5063793636619418059 0.32159551688380094703 -0.67585562191052572789 -0.05074476350936307778 0.61321630486372602498;1.1080141116504014231 -0.16419995444925750139 -0.79357953376592993422 -0.33822869869416583022 0.22754317872927465327 -0.69306259648246748561 1.1840166271541658904 -0.76277875426908325895 1.0178979584010419135 0.82294158550544271868;0.52675691437235816483 -1.0990903752954623851 0.22046975421202047452 -1.1816844015704199844 0.95738170850856552097 -1.4478320241508937372 0.35255378620410837698 0.93272500925756307577 0.27269854903872076113 -2.176900568746807707;-0.2663025096900948907 -0.091228947211965963349 -0.35191950625305812306 -0.73453429200108533159 -0.21886959123902774427 2.0010111484442014707 1.3587935671071975641 0.15873130997532094999 -0.37182444148223314784 -0.99587202572318200833;1.4512185560613974911 0.46005988876276915356 0.39945896930157914761 -1.1492107889443310409 -0.71663527135278604074 1.3940124076122957231 -0.89650183873361855014 -0.0068626841676036713646 2.2342095984141634446 -1.2734354385474861981;0.015304459241745258652 0.37014923756986312098 -1.0806285856009820723 0.67245994916565265953 0.68788593749452808801 -1.1046575811334755635 0.84085839079892699122 -0.82951544796364873324 -2.3337998838958684544 -0.13371146801009509142;-0.84993800780177530818 0.0085275139045985059311 -2.4097349873338642645 -2.947110996086357293 2.6386570871754915224 0.31629986078587463139 -1.1919948774633872812 1.1602135478659290069 0.14502690265554987747 -0.35502067189415820181;0.20598190526239196219 1.8869545201282640345 -1.4184851245954783749 -0.74743901675409896157 -1.2783973259383885068 -4.2064423269683635098 -0.85821144494500278821 -0.57750599604110952612 0.19099567551802884569 -0.88585186858070286142;-4.5998618292143653719 1.7801278491883067989 3.1817466436762709137 -1.1708011575515404612 -4.6994618619216366184 6.1434568001704832341 2.5287582842946330075 -1.9776142558590217302 -0.55998021493743266319 0.7503293510449473569;-0.27237092868489071185 -2.1007456689302417274 -1.1699704535527952753 -0.98169777592147933198 -0.37438357508051695044 0.13792546999326629753 -0.48158607419235172076 -0.14674576919499307537 -1.3888333992362891234 -1.8924961606596171215;-0.25419960756690995751 2.4228102142092002858 -1.5110904987633004826 -0.47211813472245300893 -1.3522400708249160406 0.14058895126411691257 -1.3978368982503759366 -0.29227123411462380131 -0.47509115500216225758 -1.8417046900420792621;-1.7629218086391793552 -0.17642734665201434407 -2.8134337750606035478 -0.036628885625135651494 -0.53556252897601519525 -0.34354319435577873598 -1.2952153792038811897 0.13997324617745299236 1.1503848833854244393 -0.77306974456301202903;0.56461269085284837566 -0.25125035059350092626 0.27266012679568479848 0.70891595531016560194 1.4913748192043727592 -0.78018600961333606225 0.74891994668842798433 -0.4748306285996422571 0.20152302636427416038 0.080504250322905951398;-0.74575270397044968185 0.8790580547244081222 -0.33650096667476392387 -0.095611483632662960797 1.0730041167750443698 -0.65531176220898679219 0.38735660407500810409 -0.41847843782707533355 0.77593604963809248432 0.7586170507689542486;1.4049258740272045909 3.0843293586386306693 -0.85072028817837808123 -0.67848714792643627369 2.2831622118911059083 1.4352918564200773943 1.0481626739886173993 0.13745329801361300115 0.70668121446301435107 -0.43240217214184278882;0.45735224670747154363 -0.073856131413965797616 -0.70122705811776897544 -0.09061435511441132129 -0.56111199045928517037 -5.0951404635614041538 -0.88574402848581579306 -0.76856128316264205047 0.8373765990646091506 -0.63685010648199436023;-0.039551580618187184846 -0.21344892354019678882 -0.44785199167179401414 0.063203550807716793458 -0.45095945705347506571 -0.78708447326290087442 -0.50286543129871141833 0.51018593355101549136 0.18509107638448496491 -1.052847838517098511;0.4101962885928130409 -1.2480930824510243493 -0.58278353640753788323 -0.62720048808888040348 2.099867327587150001 -1.2959517067524539691 -0.53266953061479427323 0.41749469989053322738 -1.06183200774308939 0.13659433318861374795;-0.68443311937225892461 -0.67572193444550299191 -0.83998675262117461493 -1.1549334016053036667 1.3337068044862181448 -0.15481321252818613932 -0.3954741078495352391 -0.89518888044408140292 0.55233521167498156323 1.9708534355323938936];

% Layer 2
b2 = 1.4512437090260794648;
LW2_1 = [-0.53105326135921848696 -0.8310874284009337476 2.0268292213923060352 0.10461973208732996965 0.45060192992720482508 -0.18527783118447102573 0.018608804150084250206 1.4825625072227217593 0.033448656454795104576 -0.080746366343413741862 0.18639933864150512455 -0.20836247924454068259 -0.67421737191662345356 0.036412168887686301166 -0.01126601411622859053 0.52188739373932901966 -0.16151906908499424897 -0.48939797245890037658 0.068154051398014892094 -0.51349854008801021354 0.55253348690057146886 -0.32650834196841072021 -0.9990018517376588747 0.081907588402231487623 0.088749598425136341784 -0.19573645369156320029 -2.2635088951523782974 0.14495493961691691132 -0.27585739088533933749 -0.50738702477793928836 -0.70017654755034575143 -0.11947109781310806531 -0.10195864688964777212 0.95937332166726341232 -0.20805542492417963829 -0.15525606611665265788 0.39374070138000710761 -0.54072648287529012645 -0.34841984924127228362 -0.17300813401498027488 -0.043757050934426187927 -0.1876900227318658021 -0.18993074877307328241 0.53619177077652546703 -0.041127827519465733064 0.23048924272116111389 0.0077274973177992650405 0.71026810440900400856 0.60862083447958337246 1.0931705118230645724 0.27755132329986353934 0.035212494139054729969 0.086618327976117195921 -0.70126970903036534022 -0.0072671910789327224395 0.019076002311338623174 0.074849942285470830172 0.0093116062864474404698 -1.4376574155812893441 0.26745251734330571791 0.027870163974238752053 0.43908208703334311584 0.47800741558450060564 0.52381779983282650281 0.13905464007645712554 0.055575780283359681178 -0.28058025116813589683 1.4825961107552962925 -0.074021891094380884435 -0.70659481073955265895 0.13321552964803304309 0.092285957713609007014 0.48124651537818524671 2.5046221238094212858 -0.25009345352232298376 0.17594682552146514998 -0.37617303422174441785 0.056985559498258661626 -0.048435057263957581597 -0.43801361029450763818 0.01778238303750259014 0.25068236753307288067 0.5838928672028755873 1.1908158163324336076 0.75098342894314662477 0.24666559330382908932 0.086467790302675109904 -0.099961811506464673394 0.18909151068328813872 -0.26177380410078815443 0.88390605419684131761 0.035725165126598186494 0.21243737620752295436 -0.98973509706887019544 0.032542816570355966033 0.03088564912435161347 0.40145011242989209199 -0.12475281103703246555 0.14590448991748591889 -0.11173889707352696599 -0.056676696834101224221 0.44436484099692047378 0.25599140327861302779 0.15067590469631941819 -0.02932706560357262876 0.087124515117792733498 -0.14658559061685313973 -0.93628311621198900827 0.095000827039521409945 -0.12836062248718516088 0.1160948902560905438 -0.054019221156572969078 -0.35862677823461019955 -0.44700971370059405796 0.035767132540937482399 -0.010272615521068473657 -0.1546410002031395059 -0.45032427867542568212 -0.26854165962723391958 0.12072439425227503296 0.026838041578674320248 1.7358948338897091102 -0.23677193762363896168 0.049381971285529346893 0.70921278938040610562 0.57130083430678013645 0.076729950162859203444 -0.051024788629656252226];

% Output 1
y1_step1.ymin = -1;
y1_step1.gain = 0.00113623451880468;
y1_step1.xoffset = 874.8;

% ===== SIMULATION ========

% Dimensions
Q = size(x1,2); % samples

% Input 1
xp1 = mapminmax_apply(x1,x1_step1);

% Layer 1
a1 = tansig_apply(repmat(b1,1,Q) + IW1_1*xp1);

% Layer 2
a2 = repmat(b2,1,Q) + LW2_1*a1;

% Output 1
y1 = mapminmax_reverse(a2,y1_step1);
end

% ===== MODULE FUNCTIONS ========

% Map Minimum and Maximum Input Processing Function
function y = mapminmax_apply(x,settings)
  y = bsxfun(@minus,x,settings.xoffset);
  y = bsxfun(@times,y,settings.gain);
  y = bsxfun(@plus,y,settings.ymin);
end

% Sigmoid Symmetric Transfer Function
function a = tansig_apply(n,~)
  a = 2 ./ (1 + exp(-2*n)) - 1;
end

% Map Minimum and Maximum Output Reverse-Processing Function
function x = mapminmax_reverse(y,settings)
  x = bsxfun(@minus,y,settings.ymin);
  x = bsxfun(@rdivide,x,settings.gain);
  x = bsxfun(@plus,x,settings.xoffset);
end